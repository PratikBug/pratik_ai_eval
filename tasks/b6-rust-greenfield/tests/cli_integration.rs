use assert_cmd::Command;
use predicates::prelude::*;
use std::fs;
use tempfile::tempdir;

#[test]
fn cli_prints_counts_for_sample_log() {
    let temp = tempdir().expect("temp dir");
    let log_path = temp.path().join("sample.log");
    fs::write(
        &log_path,
        "INFO boot\nWARN retry\nERROR fail\nINFO done\n",
    )
    .expect("write sample log");

    Command::cargo_bin("log-counter")
        .expect("built binary")
        .arg(&log_path)
        .assert()
        .success()
        .stdout(predicate::str::contains("INFO: 2"))
        .stdout(predicate::str::contains("WARN: 1"))
        .stdout(predicate::str::contains("ERROR: 1"));
}

#[test]
fn cli_reports_missing_file_gracefully() {
    Command::cargo_bin("log-counter")
        .expect("built binary")
        .arg("missing-log-file.log")
        .assert()
        .failure()
        .stderr(predicate::str::contains("file not found"));
}
