use std::fs;
use std::io::{self, BufRead, BufReader};
use std::path::Path;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub struct LogCounts {
    pub info: u32,
    pub warn: u32,
    pub error: u32,
}

#[derive(Debug, PartialEq, Eq)]
pub enum LogCountError {
    NotFound { path: String },
    ReadFailed { path: String, source: io::ErrorKind },
}

impl std::fmt::Display for LogCountError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            LogCountError::NotFound { path } => write!(f, "file not found: {path}"),
            LogCountError::ReadFailed { path, source } => {
                write!(f, "failed to read {path}: {source:?}")
            }
        }
    }
}

impl std::error::Error for LogCountError {}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum LogLevel {
    Info,
    Warn,
    Error,
}

impl LogLevel {
    fn as_str(self) -> &'static str {
        match self {
            LogLevel::Info => "INFO",
            LogLevel::Warn => "WARN",
            LogLevel::Error => "ERROR",
        }
    }
}

pub fn count_log_levels_from_reader<R: BufRead>(reader: R) -> io::Result<LogCounts> {
    let mut counts = LogCounts::default();

    for line in reader.lines() {
        let line = line?;
        if let Some(level) = classify_line(&line) {
            match level {
                LogLevel::Info => counts.info += 1,
                LogLevel::Warn => counts.warn += 1,
                LogLevel::Error => counts.error += 1,
            }
        }
    }

    Ok(counts)
}

pub fn count_log_levels<P: AsRef<Path>>(path: P) -> Result<LogCounts, LogCountError> {
    let path_ref = path.as_ref();
    let file = fs::File::open(path_ref).map_err(|error| match error.kind() {
        io::ErrorKind::NotFound => LogCountError::NotFound {
            path: path_ref.display().to_string(),
        },
        kind => LogCountError::ReadFailed {
            path: path_ref.display().to_string(),
            source: kind,
        },
    })?;

    count_log_levels_from_reader(BufReader::new(file)).map_err(|error| LogCountError::ReadFailed {
        path: path_ref.display().to_string(),
        source: error.kind(),
    })
}

pub fn format_counts(counts: &LogCounts) -> String {
    format!(
        "INFO: {}\nWARN: {}\nERROR: {}",
        counts.info, counts.warn, counts.error
    )
}

fn classify_line(line: &str) -> Option<LogLevel> {
    for level in [LogLevel::Error, LogLevel::Warn, LogLevel::Info] {
        if line_contains_level(line, level.as_str()) {
            return Some(level);
        }
    }
    None
}

fn line_contains_level(line: &str, level: &str) -> bool {
    line.split(|character: char| !character.is_ascii_alphanumeric())
        .any(|token| token == level)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Cursor;

    #[test]
    fn counts_info_warn_and_error_lines() {
        let input = "\
2024-01-01 INFO service started
2024-01-01 WARN low memory
2024-01-01 ERROR disk full
2024-01-01 INFO request complete
";
        let counts = count_log_levels_from_reader(Cursor::new(input)).expect("valid input");

        assert_eq!(
            counts,
            LogCounts {
                info: 2,
                warn: 1,
                error: 1,
            }
        );
    }

    #[test]
    fn returns_not_found_for_missing_file() {
        let result = count_log_levels("definitely-missing-log-file.log");

        assert_eq!(
            result,
            Err(LogCountError::NotFound {
                path: "definitely-missing-log-file.log".to_string(),
            })
        );
    }

    #[test]
    fn empty_file_returns_zero_counts() {
        let counts = count_log_levels_from_reader(Cursor::new("")).expect("valid input");

        assert_eq!(counts, LogCounts::default());
    }

    #[test]
    fn ignores_lines_without_log_levels() {
        let input = "plain text line\nanother line\n";
        let counts = count_log_levels_from_reader(Cursor::new(input)).expect("valid input");

        assert_eq!(counts, LogCounts::default());
    }
}
