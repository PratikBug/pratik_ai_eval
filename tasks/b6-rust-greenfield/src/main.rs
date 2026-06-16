use clap::Parser;
use log_counter::{count_log_levels, format_counts, LogCountError};
use std::path::PathBuf;
use std::process;

#[derive(Parser, Debug)]
#[command(name = "log-counter", about = "Count INFO, WARN, and ERROR lines in a log file")]
struct Cli {
    /// Path to the log file to analyze
    file: PathBuf,
}

fn main() {
    let cli = Cli::parse();

    match count_log_levels(&cli.file) {
        Ok(counts) => {
            print!("{}", format_counts(&counts));
        }
        Err(LogCountError::NotFound { path }) => {
            eprintln!("error: file not found: {path}");
            process::exit(1);
        }
        Err(error) => {
            eprintln!("error: {error}");
            process::exit(1);
        }
    }
}
