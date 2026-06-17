use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Deserialize, Serialize, PartialEq)]
pub struct ScoreRequest {
    pub transaction_id: String,
    pub amount: f64,
    pub merchant_id: String,
}

#[derive(Debug, Clone, Deserialize, Serialize, PartialEq)]
pub struct ScoreResponse {
    pub score: u8,
    pub reasons: Vec<String>,
}

pub fn compute_score(amount: f64, merchant_id: &str) -> ScoreResponse {
    let amount_part = (amount as i64).rem_euclid(97) as u8;
    let merchant_part = merchant_id.len().min(100) as u8;
    let raw = amount_part.saturating_add(merchant_part);
    let score = raw.min(100);

    let mut reasons = Vec::new();
    if amount > 100.0 {
        reasons.push("high_amount".to_string());
    } else if amount > 50.0 {
        reasons.push("amount_band".to_string());
    }
    if merchant_id.len() > 8 {
        reasons.push("long_merchant_id".to_string());
    } else if merchant_id.len() > 3 {
        reasons.push("merchant_length".to_string());
    }
    if reasons.is_empty() {
        reasons.push("baseline".to_string());
    }

    ScoreResponse { score, reasons }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn score_is_deterministic_and_bounded() {
        let first = compute_score(150.0, "m-42");
        let second = compute_score(150.0, "m-42");
        assert_eq!(first, second);
        assert!(first.score <= 100);
        assert!(!first.reasons.is_empty());
    }

    #[test]
    fn higher_amount_changes_score() {
        let low = compute_score(10.0, "acme");
        let high = compute_score(250.0, "acme");
        assert_ne!(low.score, high.score);
    }
}
