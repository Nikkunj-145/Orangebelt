#![no_std]
use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, symbol_short, vec, Address, Env, String,
    Symbol, Vec,
};

const MAX_TEXT_LEN: u32 = 200;
const MAX_TAG_LEN: u32 = 30;

#[contracterror]
#[derive(Copy, Clone, Debug, PartialEq, Eq)]
#[repr(u32)]
pub enum Error {
    TextEmpty = 1,
    TextTooLong = 2,
    TagTooLong = 3,
    NotFound = 4,
}

#[contracttype]
#[derive(Clone)]
pub struct Wish {
    pub id: u32,
    pub author: Address,
    pub text: String,
    pub tag: String,
    pub ledger: u32,
    pub timestamp: u64,
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Counter,
    Wish(u32),
}

const POST_EVT: Symbol = symbol_short!("post");

#[contract]
pub struct WishboardContract;

#[contractimpl]
impl WishboardContract {
    /// Post a new wish. Returns the assigned id.
    /// Emits ("post", author) -> (id, tag).
    pub fn post(env: Env, author: Address, text: String, tag: String) -> Result<u32, Error> {
        author.require_auth();

        if text.len() == 0 {
            return Err(Error::TextEmpty);
        }
        if text.len() > MAX_TEXT_LEN {
            return Err(Error::TextTooLong);
        }
        if tag.len() > MAX_TAG_LEN {
            return Err(Error::TagTooLong);
        }

        let next_id: u32 = env
            .storage()
            .instance()
            .get(&DataKey::Counter)
            .unwrap_or(0);
        let id = next_id + 1;

        let wish = Wish {
            id,
            author: author.clone(),
            text,
            tag: tag.clone(),
            ledger: env.ledger().sequence(),
            timestamp: env.ledger().timestamp(),
        };
        env.storage().persistent().set(&DataKey::Wish(id), &wish);
        env.storage().instance().set(&DataKey::Counter, &id);

        env.events().publish((POST_EVT, author), (id, tag));
        Ok(id)
    }

    pub fn count(env: Env) -> u32 {
        env.storage().instance().get(&DataKey::Counter).unwrap_or(0)
    }

    pub fn get(env: Env, id: u32) -> Result<Wish, Error> {
        env.storage()
            .persistent()
            .get(&DataKey::Wish(id))
            .ok_or(Error::NotFound)
    }

    /// Returns the most recent `n` wishes (newest first).
    pub fn recent(env: Env, n: u32) -> Vec<Wish> {
        let total: u32 = env.storage().instance().get(&DataKey::Counter).unwrap_or(0);
        let mut out: Vec<Wish> = vec![&env];
        if total == 0 || n == 0 {
            return out;
        }
        let limit = if n > total { total } else { n };
        let mut id = total;
        for _ in 0..limit {
            if let Some(w) = env.storage().persistent().get::<DataKey, Wish>(&DataKey::Wish(id)) {
                out.push_back(w);
            }
            if id == 1 {
                break;
            }
            id -= 1;
        }
        out
    }
}

#[cfg(test)]
mod test;
