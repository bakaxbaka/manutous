# 🔑 Accounts & State: Where Your Data Lives on Solana

## A quick story to anchor the idea
Think of a Solana account like a small locker on a public hallway. The hallway is the blockchain. The locker has an address (where it lives), some space inside (its data), and an owner (the program that’s allowed to change what’s inside). Your wallet holds the keys that let you open lockers you control or authorize programs to act.

Once you see “lockers on a public hallway,” the rest of Solana makes more sense.

## What an account actually is
- An **account** is a chunk of on‑chain storage with:
  - an **address** (where it lives),
  - an **owner** (the program that can write to it),
  - a **lamport balance** (to be rent‑exempt),
  - and optional **data bytes** (the state you care about).

**Learn the formal definition:**  
[Accounts (core docs)](https://solana.com/docs/core/accounts)

## Who is allowed to change an account?
- Only the **owner program** can modify an account’s data.
- Your **wallet** signs to approve actions, but programs perform writes.
- When you call a program, you **pass accounts in** and the program validates:
  - “Am I the owner of this account?”
  - “Did the signer authorize this?”
  - “Is there enough space and rent to store the changes?”

**Read more:**  
[Programs on Solana](https://solana.com/docs/core/programs)

## Do accounts cost money? The rent‑exempt idea
Solana avoids monthly rent by having most accounts be **rent‑exempt**.  
You deposit a small amount of SOL (lamports) so the account can live on chain permanently. If you later **close** the account, you get those lamports back.

**Details:**  
[Fees & Rent‑exemption](https://solana.com/docs/core/fees#rent-exemption)

## Common account types you’ll meet
- **System accounts** – minimal accounts created by the System Program (often just to hold SOL).  
  Docs: [Programs (Core Programs → System Program)](https://solana.com/docs/core/programs)
- **SPL Token accounts** – hold fungible tokens or NFTs under the SPL Token Program.  
  Overview: [Tokens on Solana](https://solana.com/docs/tokens)
- **Program Derived Accounts (PDAs)** – program‑owned accounts whose addresses are derived from seeds. No private key controls them; the program does.  
  Guide: [Program Derived Address (PDA)](https://solana.com/docs/core/pda)

## PDAs in practice (why they’re powerful)
A PDA is like a locker whose key is built into the program itself. You can deterministically create “the same” address for a given user or collection without generating new private keys. This is how many apps keep per‑user state (profiles, vaults, positions).

## How state flows in a transaction (simple view)
1. Your wallet signs a transaction that calls a **program**.  
2. The transaction includes the **accounts** the program may read/write.  
3. The program checks owners, signers, sizes, and balances.  
4. If rules pass, it updates **account data** and the chain records the new state.

**Reference:**  
[Transactions & Instructions](https://solana.com/docs/core/transactions)

## Hands‑on: see accounts and state in the wild
1. Open Solana Explorer on **devnet**:  
   [explorer.solana.com?cluster=devnet](https://explorer.solana.com?cluster=devnet)  
2. Paste any **wallet address** to view its system account and token accounts.  
3. Expand an **SPL token account** and notice:
   - the **mint** (which token it represents),
   - the **owner** (who controls the account),
   - the **amount/decimals** (the balance).

**Copy‑paste recipes:**  
[Solana Cookbook (search “accounts” examples)](https://solana.com/developers/cookbook)

## Anchor perspective (for when you start building)
Anchor makes accounts feel like typed structs. You define an account type, specify who signs and which program owns it, and Anchor handles a lot of the boilerplate.

- [Anchor Docs](https://www.anchor-lang.com)  
- [Anchor “Book” (redirects to docs)](https://book.anchor-lang.com)

## Common pitfalls (and how to avoid them)
- **“Instruction requires a signature”** – you forgot to include the signer or didn’t forward `signer` properly in the client.  
- **“Account not rent‑exempt / insufficient lamports”** – fund the account with more lamports to meet rent‑exempt minimum.  
- **“Invalid account owner”** – the program trying to write is not the account’s owner; create the account owned by the correct program or pass the right account.

## Quick recap
- Accounts are on‑chain storage units with an address, an owner program, lamports, and data.  
- Programs, not wallets, write data; your wallet authorizes actions by signing.  
- Most accounts must be **rent‑exempt** (funded up front, refundable when closed).  
- SPL Token accounts and PDAs are the workhorses you’ll use constantly.

## ✍️ Explain it yourself
Say this out loud or type it:  
**“A Solana account is different from a bank account because…”**  
If you can explain that cleanly, you’ve got the core idea.

## 📚 Further learning
- [Accounts (core docs)](https://solana.com/docs/core/accounts)  
- [Fees & Rent‑exemption](https://solana.com/docs/core/fees#rent-exemption)  
- [Programs on Solana](https://solana.com/docs/core/programs)  
- [Tokens on Solana](https://solana.com/docs/tokens)  
- [PDAs](https://solana.com/docs/core/pda)  
- [Transactions](https://solana.com/docs/core/transactions)  
- [Explorer (devnet)](https://explorer.solana.com?cluster=devnet)  
- [Cookbook](https://solana.com/developers/cookbook)  
- [Anchor Docs](https://www.anchor-lang.com)

### ⬅️ Previous
[👛 Wallets: Your Web3 Passport](./wallets-your-web3-passport.md)

### ➡️ Next
[🎨 Tokens & NFTs: Digital Assets on Solana](./tokens-and-nfts.md)
