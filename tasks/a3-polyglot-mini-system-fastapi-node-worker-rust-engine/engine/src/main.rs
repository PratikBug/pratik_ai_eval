use axum::{
    extract::Json,
    routing::{get, post},
    Router,
};
use fraud_engine::{compute_score, ScoreRequest, ScoreResponse};
use std::env;
use tokio::net::TcpListener;

async fn health() -> Json<serde_json::Value> {
    Json(serde_json::json!({ "status": "ok" }))
}

async fn score(Json(payload): Json<ScoreRequest>) -> Json<ScoreResponse> {
    Json(compute_score(payload.amount, &payload.merchant_id))
}

#[tokio::main]
async fn main() {
    let args: Vec<String> = env::args().collect();
    if args.len() < 2 || args[1] != "serve" {
        eprintln!("Usage: fraud-engine serve");
        std::process::exit(1);
    }

    let port = env::var("ENGINE_PORT").unwrap_or_else(|_| "8782".to_string());
    let addr = format!("127.0.0.1:{port}");

    let app = Router::new()
        .route("/health", get(health))
        .route("/score", post(score));

    let listener = TcpListener::bind(&addr).await.expect("bind engine port");
    println!("fraud-engine listening on http://{addr}");
    axum::serve(listener, app).await.expect("engine server failed");
}
