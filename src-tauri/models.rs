// Models module for Tauri backend
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Subscription {
    pub id: String,
    pub name: String,
    pub amount: f64,
    pub currency: String,
    pub next_billing_date: String,
    pub category: String,
    pub payment_method: String,
    pub notes: String,
    pub active: bool
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CalendarEvent {
    pub id: String,
    pub title: String,
    pub start: chrono::NaiveDateTime,
    pub end: chrono::NaiveDateTime,
    pub color: String
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SpendingSummary {
    pub total_monthly: f64,
    pub by_category: std::collections::HashMap<String, f64>
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PaymentMethod {
    pub id: String,
    pub last_four: String,
    pub brand: String,
    pub expiration_month: u32,
    pub expiration_year: u32
}