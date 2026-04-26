#![cfg(test)]
use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env, String};

fn setup<'a>() -> (Env, WishboardContractClient<'a>) {
    let env = Env::default();
    env.mock_all_auths();
    let id = env.register(WishboardContract, ());
    let client = WishboardContractClient::new(&env, &id);
    (env, client)
}

#[test]
fn post_and_get() {
    let (env, client) = setup();
    let alice = Address::generate(&env);
    let id = client.post(
        &alice,
        &String::from_str(&env, "Hello Stellar"),
        &String::from_str(&env, "intro"),
    );
    assert_eq!(id, 1);
    let wish = client.get(&id);
    assert_eq!(wish.author, alice);
    assert_eq!(wish.text, String::from_str(&env, "Hello Stellar"));
    assert_eq!(wish.tag, String::from_str(&env, "intro"));
}

#[test]
fn count_increments() {
    let (env, client) = setup();
    let alice = Address::generate(&env);
    assert_eq!(client.count(), 0);
    client.post(&alice, &String::from_str(&env, "one"), &String::from_str(&env, ""));
    client.post(&alice, &String::from_str(&env, "two"), &String::from_str(&env, ""));
    client.post(&alice, &String::from_str(&env, "three"), &String::from_str(&env, ""));
    assert_eq!(client.count(), 3);
}

#[test]
fn empty_text_rejected() {
    let (env, client) = setup();
    let alice = Address::generate(&env);
    let res = client.try_post(&alice, &String::from_str(&env, ""), &String::from_str(&env, ""));
    assert!(res.is_err());
}

#[test]
fn too_long_text_rejected() {
    let (env, client) = setup();
    let alice = Address::generate(&env);
    // 201 chars (limit is 200)
    let long: &str = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";
    assert_eq!(long.len(), 201);
    let res = client.try_post(
        &alice,
        &String::from_str(&env, long),
        &String::from_str(&env, ""),
    );
    assert!(res.is_err());
}

#[test]
fn recent_newest_first() {
    let (env, client) = setup();
    let alice = Address::generate(&env);
    client.post(&alice, &String::from_str(&env, "first"), &String::from_str(&env, ""));
    client.post(&alice, &String::from_str(&env, "second"), &String::from_str(&env, ""));
    client.post(&alice, &String::from_str(&env, "third"), &String::from_str(&env, ""));

    let recent = client.recent(&2);
    assert_eq!(recent.len(), 2);
    assert_eq!(recent.get(0).unwrap().text, String::from_str(&env, "third"));
    assert_eq!(recent.get(1).unwrap().text, String::from_str(&env, "second"));
}

#[test]
fn not_found_for_unknown_id() {
    let (env, client) = setup();
    let res = client.try_get(&999);
    assert!(res.is_err());
}
