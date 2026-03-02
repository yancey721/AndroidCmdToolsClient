use serde::Serialize;
use std::io::{BufRead, BufReader, Write};
use std::process::{Command, Stdio};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use tauri::{AppHandle, Emitter};

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

#[tauri::command]
pub async fn execute_script(
    app: AppHandle,
    script_path: String,
    stdin_inputs: Vec<String>,
    working_dir: Option<String>,
) -> Result<(), String> {
    let bash = find_bash();
    let cwd = working_dir.unwrap_or_else(|| ".".to_string());

    let mut child = Command::new(&bash)
        .arg(&script_path)
        .current_dir(&cwd)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("启动脚本失败: {}", e))?;

    if let Some(mut stdin) = child.stdin.take() {
        let inputs = stdin_inputs.clone();
        std::thread::spawn(move || {
            for input in inputs {
                let _ = writeln!(stdin, "{}", input);
                let _ = stdin.flush();
                std::thread::sleep(std::time::Duration::from_millis(100));
            }
        });
    }

    let finished = Arc::new(AtomicBool::new(false));

    if let Some(stdout) = child.stdout.take() {
        let app_clone = app.clone();
        let finished_clone = finished.clone();
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
            finished_clone.store(true, Ordering::SeqCst);
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

    let status = child
        .wait()
        .map_err(|e| format!("等待脚本结束失败: {}", e))?;

    let code = status.code().unwrap_or(-1);
    let _ = app.emit(
        "shell-exit",
        ShellExit {
            code,
            success: status.success(),
        },
    );

    Ok(())
}
