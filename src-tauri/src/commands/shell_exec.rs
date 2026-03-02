use serde::Serialize;
use std::io::{BufRead, BufReader, Write};
use std::path::PathBuf;
use std::process::{Command, Stdio};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use tauri::{AppHandle, Emitter, Manager};

#[derive(Serialize, Clone, Debug)]
pub struct ShellOutput {
    pub line: String,
    pub stream: String,
}

#[derive(Serialize, Clone, Debug)]
pub struct ShellExit {
    pub code: i32,
    pub success: bool,
}

fn find_bash() -> String {
    #[cfg(target_os = "windows")]
    {
        let git_bash = "C:\\Program Files\\Git\\bin\\bash.exe";
        if std::path::Path::new(git_bash).exists() {
            return git_bash.to_string();
        }
        "bash".to_string()
    }
    #[cfg(not(target_os = "windows"))]
    {
        "/bin/bash".to_string()
    }
}

fn resolve_project_root(app: &AppHandle) -> PathBuf {
    if let Ok(resource_dir) = app.path().resource_dir() {
        let scripts_in_resource = resource_dir.join("AndroidCmdTools").join("shell");
        if scripts_in_resource.exists() {
            return resource_dir;
        }
    }

    if let Ok(exe_path) = std::env::current_exe() {
        let mut dir = exe_path.parent().map(|p| p.to_path_buf());
        for _ in 0..10 {
            if let Some(ref d) = dir {
                let candidate = d.join("AndroidCmdTools").join("shell");
                if candidate.exists() {
                    return d.clone();
                }
                dir = d.parent().map(|p| p.to_path_buf());
            } else {
                break;
            }
        }
    }

    let manifest_dir = env!("CARGO_MANIFEST_DIR");
    let project_root = PathBuf::from(manifest_dir)
        .parent()
        .map(|p| p.to_path_buf())
        .unwrap_or_else(|| PathBuf::from("."));

    if project_root.join("AndroidCmdTools").join("shell").exists() {
        return project_root;
    }

    PathBuf::from(".")
}

#[tauri::command]
pub async fn execute_script(
    app: AppHandle,
    script_path: String,
    stdin_inputs: Vec<String>,
    post_inputs: Vec<String>,
    post_delay_ms: Option<u64>,
    working_dir: Option<String>,
) -> Result<(), String> {
    let bash = find_bash();

    let project_root = resolve_project_root(&app);
    let full_script_path = project_root.join(&script_path);

    if !full_script_path.exists() {
        return Err(format!(
            "脚本文件不存在: {}\n项目根目录: {}",
            full_script_path.display(),
            project_root.display()
        ));
    }

    let android_cmd_tools_dir = project_root.join("AndroidCmdTools");
    let cwd = working_dir
        .map(PathBuf::from)
        .unwrap_or_else(|| {
            if android_cmd_tools_dir.exists() {
                android_cmd_tools_dir
            } else {
                project_root.clone()
            }
        });

    let mut child = Command::new(&bash)
        .arg(full_script_path.to_str().unwrap_or(&script_path))
        .current_dir(&cwd)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("启动脚本失败: {}", e))?;

    let process_done = Arc::new(AtomicBool::new(false));
    let done_for_stdin = process_done.clone();

    if let Some(mut stdin) = child.stdin.take() {
        let inputs = stdin_inputs.clone();
        let delayed = post_inputs;
        let delay = post_delay_ms.unwrap_or(3000);
        std::thread::spawn(move || {
            for input in &inputs {
                if done_for_stdin.load(Ordering::Relaxed) {
                    return;
                }
                let _ = writeln!(stdin, "{}", input);
                let _ = stdin.flush();
                std::thread::sleep(std::time::Duration::from_millis(100));
            }

            if !delayed.is_empty() {
                std::thread::sleep(std::time::Duration::from_millis(delay));
                for input in &delayed {
                    if done_for_stdin.load(Ordering::Relaxed) {
                        return;
                    }
                    let _ = writeln!(stdin, "{}", input);
                    let _ = stdin.flush();
                    std::thread::sleep(std::time::Duration::from_millis(200));
                }
            }

            // Keep stdin open to prevent scripts from getting EOF on `read`,
            // which can trigger infinite loops in while-true validation loops.
            // Timeout after 60s as a safety net.
            let start = std::time::Instant::now();
            while !done_for_stdin.load(Ordering::Relaxed) {
                if start.elapsed() > std::time::Duration::from_secs(60) {
                    break;
                }
                std::thread::sleep(std::time::Duration::from_millis(500));
            }
        });
    }

    if let Some(stdout) = child.stdout.take() {
        let app_clone = app.clone();
        std::thread::spawn(move || {
            let reader = BufReader::new(stdout);
            for line in reader.lines() {
                if let Ok(line) = line {
                    let _ = app_clone.emit(
                        "shell-output",
                        ShellOutput {
                            line,
                            stream: "stdout".to_string(),
                        },
                    );
                }
            }
        });
    }

    if let Some(stderr) = child.stderr.take() {
        let app_clone = app.clone();
        std::thread::spawn(move || {
            let reader = BufReader::new(stderr);
            for line in reader.lines() {
                if let Ok(line) = line {
                    let _ = app_clone.emit(
                        "shell-output",
                        ShellOutput {
                            line,
                            stream: "stderr".to_string(),
                        },
                    );
                }
            }
        });
    }

    let app_for_exit = app.clone();
    std::thread::spawn(move || {
        let status = child.wait();
        process_done.store(true, Ordering::Relaxed);
        let (code, success) = match status {
            Ok(s) => (s.code().unwrap_or(-1), s.success()),
            Err(_) => (-1, false),
        };
        let _ = app_for_exit.emit(
            "shell-exit",
            ShellExit { code, success },
        );
    });

    Ok(())
}
