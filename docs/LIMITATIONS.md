# Limitations & Known Protocol Boundaries

1. **RPC Log Range Constraints on Public Endpoints**:
   - The public Base endpoint (`https://mainnet.base.org`) aggressively throttles or rejects historical `eth_getLogs` scans spanning more than a few thousand blocks without an authenticated API key.
   - To ensure fast initial page loads without RPC timeouts, the application ships with pre-indexed verified historical trade logs for Market #3 while retaining live RPC readers for current state, TWAP, reserves, and lifecycle statuses.

2. **Single Active Market Constraint**:
   - `UmiaHub` and `UmiaMarketCore` enforce that a given venture can only run one decision market at a time (`VentureMarketAlreadyActive`).
   - All three markets discovered on Base have already concluded their trading windows and settled.

3. **Uniswap V4 Spot Pool Visibility**:
   - Because Uniswap V4 is deployed as a singleton (`PoolManager`), individual spot liquidity positions are managed via `SpotLiquidityVault` NFTs. Detailed tick-level liquidity distribution requires querying Uniswap V4 periphery lenses.

4. **Off-Chain Proposal Descriptions**:
   - Umia stores proposal titles directly in contract state (e.g., `_proposals[id].title`), but longer contextual proposals (PDFs or board consent files) are linked via IPFS hashes or forum posts.
