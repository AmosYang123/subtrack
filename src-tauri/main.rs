#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

mod models;

use std::sync::Mutex;
use tauri::Manager;
use serde::{Deserialize, Serialize};
use crate::models::{Subscription, CalendarEvent, SpendingSummary, PaymentMethod};

#[derive(Default, Serialize, Deserialize, Clone)]
struct AppState {
    subscriptions: Vec<Subscription>,
}

fn main() {
    tauri::Builder::default()
        .manage(Mutex::new(AppState::default()))
        .setup(|app| {
            #[cfg(debug_assertions)]
            {
                // Only enable devtools in dev builds
                let window = app.get_window("main").unwrap();
                window.open_devtools();
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_subscriptions,
            save_subscription,
            delete_subscription,
            scan_emails,
            get_calendar_events,
            calculate_spending,
            add_payment_method,
            get_payment_methods
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
fn get_subscriptions(state: tauri::State<'_, Mutex<AppState>>) -> Result<Vec<Subscription>, String> {
    let state = state.lock().map_err(|e| e.to_string())?;
    Ok(state.subscriptions.clone())
}

#[tauri::command]
fn save_subscription(state: tauri::State<'_, Mutex<AppState>>, subscription: Subscription) -> Result<(), String> {
    let mut state = state.lock().map_err(|e| e.to_string())?;
    state.subscriptions.push(subscription);
    Ok(())
}

#[tauri::command]
fn delete_subscription(state: tauri::State<'_, Mutex<AppState>>, id: String) -> Result<(), String> {
    let mut state = state.lock().map_err(|e| e.to_string())?;
    state.subscriptions.retain(|s| s.id != id);
    Ok(())
}

#[tauri::command]
fn scan_emails(state: tauri::State<'_, Mutex<AppState>>) -> Result<Vec<Subscription>, String> {
    // Mock implementation - in real app would integrate with email provider
    let mut state = state.lock().map_err(|e| e.to_string())?;

    // Example subscriptions from scanned emails
    let scanned_subs = vec![
        Subscription {
            id: "netflix-001".to_string(),
            name: "Netflix".to_string(),
            amount: 15.99,
            currency: "USD".to_string(),
            next_billing_date: "2026-09-15".to_string(),
            category: "Entertainment".to_string(),
            payment_method: "Visa ending in 4242".to_string(),
            notes: "Basic plan".to_string(),
            active: true
        },
        Subscription {
            id: "spotify-002".to_string(),
            name: "Spotify Premium".to_string(),
            amount: 9.99,
            currency: "USD".to_string(),
            next_billing_date: "2026-08-20".to_string(),
            category: "Music".to_string(),
            payment_method: "Mastercard ending in 1234".to_string(),
            notes: "Individual plan".to_string(),
            active: true
        }
    ];

    // Add new subscriptions not already present
    for sub in scanned_subs {
        if !state.subscriptions.iter().any(|s| s.id == sub.id) {
            state.subscriptions.push(sub);
        }
    }

    Ok(state.subscriptions.clone())
}

#[tauri::command]
fn get_calendar_events(state: tauri::State<'_, Mutex<AppState>>) -> Result<Vec<CalendarEvent>, String> {
    let state = state.lock().map_err(|e| e.to_string())?;
    let mut events = Vec::new();

    for sub in &state.subscriptions {
        if !sub.active { continue; }

        let date = chrono::NaiveDate::parse_from_str(&sub.next_billing_date, "%Y-%m-%d")
            .unwrap_or_else(|_| chrono::Utc::now().naive_local().date());

        events.push(CalendarEvent {
            id: sub.id.clone(),
            title: format!("{} - ${:.2}", sub.name, sub.amount),
            start: date.and_hms_opt(0, 0, 0).unwrap(),
            end: date.and_hms_opt(23, 59, 59).unwrap(),
            color: match sub.category.as_str() {
                "Entertainment" => "#4CC9F0",
                "Music" => "#F72585",
                "Software" => "#89CFF0",
                "News" => "#F8961E",
                "Fitness" => "#6A4C93",
                _ => "#4CC9F0"
            }.to_string()
        });
    }

    Ok(events)
}

#[tauri::command]
fn calculate_spending(state: tauri::State<'_, Mutex<AppState>>) -> Result<SpendingSummary, String> {
    let state = state.lock().map_err(|e| e.to_string())?;

    let mut total_monthly = 0.0;
    let mut by_category: std::collections::HashMap<String, f64> = std::collections::HashMap::new();

    for sub in &state.subscriptions {
        if !sub.active { continue; }

        total_monthly += sub.amount;
        *by_category.entry(sub.category.clone()).or_insert(0.0) += sub.amount;
    }

    Ok(SpendingSummary {
        total_monthly,
        by_category
    })
}

#[tauri::command]
fn add_payment_method(_state: tauri::State<'_, Mutex<AppState>>, _method: PaymentMethod) -> Result<(), String> {
    // In a real app, this would securely store the payment method
    // For demo, we'll just accept it
    Ok(())
}

#[tauri::command]
fn get_payment_methods(_state: tauri::State<'_, Mutex<AppState>>) -> Result<Vec<PaymentMethod>, String> {
    // Mock payment methods
    Ok(vec![
        PaymentMethod {
            id: "pm-001".to_string(),
            last_four: "4242".to_string(),
            brand: "Visa".to_string(),
            expiration_month: 12,
            expiration_year: 2025
        },
        PaymentMethod {
            id: "pm-002".to_string(),
            last_four: "1234".to_string(),
            brand: "Mastercard".to_string(),
            expiration_month: 6,
            expiration_year: 2024
        }
    ])
}