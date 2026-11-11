import './style.css'
import { ethers } from 'ethers'
import { submitRomeTx, submitRomeTxV1 } from '@rome-protocol/sdk'
import { Connection, PublicKey } from '@solana/web3.js'
import { getWallets } from '@wallet-standard/app'

const ROME = {
  chainId: 200010,
  chainIdHex: '0x30d4a',
  name: 'Rome Hadrian',
  rpc: 'https://hadrian.testnet.romeprotocol.xyz/',
  explorer: 'https://via-hadrian.testnet.romeprotocol.xyz/',
  currency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
  solanaRpc: 'https://api.devnet.solana.com',
  solanaChain: 'solana:devnet',
  programId: 'RPTWwELXAY4KC9ZPHhaxp7Sq1hHtU3HNEgLbSegCcWf'
}
const CONTRACT = '0xdAe249302D9b3C59071666feAAcbFfd48243c49a'
const ABI = ['function message() view returns (string)', 'function setMessage(string newMessage)']
const iface = new ethers.Interface(ABI)
const readProvider = new ethers.JsonRpcProvider(ROME.rpc)
const solanaConnection = new Connection(ROME.solanaRpc, 'confirmed')
const walletRegistry = getWallets()

let evmProviders = []
let evmSession = null
let solSession = null
let activity = []

const $ = (s) => document.querySelector(s)
$('#app').innerHTML = `
<div class="shell">
  <header class="topbar"><a class="brand" href="#"><b>R</b> ROME <span>/ INTEROP</span></a><div class="topmeta"><i></i> HADRIAN TESTNET <a href="${ROME.explorer}" target="_blank" rel="noreferrer">EXPLORER ↗</a></div></header>
  <main>
    <section class="hero">
      <div class="hero-copy"><div class="eyebrow">A SHARED EXECUTION ENVIRONMENT</div><h1>ONE STATE.<br><em>TWO</em> WAYS IN.</h1><p>EVM and Solana wallets. One Rome chain. Connect either lane and interact with the same on-chain contract.</p><div class="hero-facts"><span>ROME HADRIAN</span><span>CHAIN ID 200010</span><span>USDC GAS</span></div></div>
      <div class="hero-art"><span class="coord c1">EVM / 01</span><span class="coord c2">SVM / 02</span><div class="shape shape-back"></div><div class="shape shape-front"></div><div class="bridge"></div><div class="core">R</div><div class="orbit"></div><div class="art-note">ONE SHARED STATE<br><b>NO BRIDGE BETWEEN LANES</b></div></div>
      <div class="hero-count">01 <i>/</i> 03</div>
    </section>

    <section class="section-head"><div><div class="eyebrow">CONNECT YOUR ENTRY POINT</div><h2>Choose your <em>lane.</em></h2></div><p>Connect independently. Use one wallet or both.</p></section>
    <section class="lanes">
      <article class="lane evm"><div class="lane-top"><span>01</span><span>EVM LANE</span></div><div class="lane-icon">Ξ</div><h3>EVM wallet</h3><p>Use your familiar Ethereum wallet to access Rome Hadrian.</p><small>METAMASK · RABBY · COINBASE · OKX · OTHERS</small><div class="wallet-status" id="evm-status">● Not connected</div><div class="address" id="evm-address">Connect an EVM wallet to begin</div><div class="balance"><span>ROME GAS BALANCE</span><b id="evm-balance">— USDC</b></div><button class="btn dark" id="connect-evm">Connect EVM wallet <span>↗</span></button><button class="disconnect hidden" id="disconnect-evm">Disconnect this session</button></article>
      <article class="lane sol"><div class="lane-top"><span>02</span><span>SOLANA LANE</span></div><div class="lane-icon">◎</div><h3>Solana wallet</h3><p>Use a Solana key to drive the same Rome EVM contract.</p><small>PHANTOM · SOLFLARE · BACKPACK · WALLET STANDARD</small><div class="wallet-status" id="sol-status">● Not connected</div><div class="address" id="sol-address">Connect a Solana wallet to begin</div><div class="balance"><span>DEVNET FEE BALANCE</span><b id="sol-balance">— SOL</b></div><button class="btn blue" id="connect-sol">Connect Solana wallet <span>↗</span></button><button class="disconnect hidden" id="disconnect-sol">Disconnect this session</button><p class="footnote">Wallet connection and Rome transaction signing are separate capabilities. Some Solana wallets can connect but may not support Rome's v1 transaction format yet.</p></article>
    </section>

    <section class="architecture"><div class="architecture-copy"><div class="eyebrow">THE ROME MODEL</div><h2>Different keys.<br><em>Same contract.</em></h2><p>Rome runs EVM execution inside the Solana runtime. Both wallet lanes can reach the same contract state. Verify it with a live read and a write from either side.</p><small>NOT A TOKEN BRIDGE / NOT A BALANCE MIRROR</small></div><div class="flow"><div class="flow-box evm-box"><small>EVM KEY</small><b>Ethereum<br>tooling</b><span>submitRomeTx</span></div><div class="flow-mid"><i></i><b>R</b><i></i><small>SHARED STATE</small></div><div class="flow-box sol-box"><small>SOLANA KEY</small><b>Solana<br>signer</b><span>submitRomeTxV1</span></div></div></section>

    <section class="shared"><div class="section-head shared-head"><div><div class="eyebrow">LIVE ON-CHAIN PROOF</div><h2>One message.<br><em>Two lanes.</em></h2></div><div class="contract"><small>SHARED CONTRACT</small><a href="${ROME.explorer}address/${CONTRACT}" target="_blank" rel="noreferrer">${CONTRACT.slice(0,8)}…${CONTRACT.slice(-6)} ↗</a></div></div>
      <div class="state-box"><div class="state-top"><span>● LIVE READ</span><button id="refresh-message">REFRESH ↻</button></div><div id="message">Reading Rome state…</div><div class="state-foot"><span>FUNCTION <b>message()</b></span><span>NETWORK <b>HADRIAN / 200010</b></span></div></div>
      <div class="writes">
        <article class="write"><div class="write-top"><span>WRITE / 01</span><b>EVM LANE</b></div><h3>Write with EVM</h3><p>Sign with your connected EVM wallet. Rome SDK handles the write path.</p><label for="evm-input">NEW SHARED MESSAGE</label><input id="evm-input" maxlength="120" placeholder="Write something to Rome…"><button class="btn dark" id="write-evm">Sign with EVM wallet <span>↗</span></button><div class="tx-result" id="evm-result"></div></article>
        <article class="write"><div class="write-top"><span>WRITE / 02</span><b>SOLANA LANE</b></div><h3>Write with Solana</h3><p>Sign the Rome authorization and Solana v1 transaction with your Solana wallet.</p><label for="sol-input">NEW SHARED MESSAGE</label><input id="sol-input" maxlength="120" placeholder="Write something to Rome…"><button class="btn blue" id="write-sol">Sign with Solana wallet <span>↗</span></button><div class="tx-result" id="sol-result"></div></article>
      </div>
    </section>
    <section class="activity"><div><div class="eyebrow">THIS SESSION</div><h2>Activity <em>log.</em></h2></div><div id="activity-list"><p class="empty">Wallet and transaction events will appear here.</p></div></section>
  </main>
  <footer><a class="brand" href="#"><b>R</b> ROME <span>/ INTEROP</span></a><small>BUILT ON ROME HADRIAN TESTNET</small><a href="${ROME.explorer}" target="_blank" rel="noreferrer">ROME EXPLORER ↗</a></footer>
</div>
<div class="modal hidden" id="modal"><div class="modal-card"><button class="close" id="close-modal">×</button><div class="eyebrow">WALLET CONNECTION</div><h2 id="modal-title">Choose your wallet.</h2><p id="modal-desc">Select a compatible wallet provider.</p><div id="wallet-options" class="wallet-options"></div><small id="modal-note"></small></div></div><div class="toast" id="toast"></div>`

function short(value) { return value ? `${value.slice(0, 9)}…${value.slice(-7)}` : '—' }
function errorText(error) { return error?.shortMessage || error?.reason || error?.message || String(error) }
function notify(message, type = '') { const el = $('#toast'); el.textContent = message; el.className = `toast show ${type}`; clearTimeout(notify.timer); notify.timer = setTimeout(() => el.className = 'toast', 4000) }
function log(title, detail, type = '') {
  activity.unshift({ title, detail, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), type }); activity = activity.slice(0, 7)
  const list = $('#activity-list'); list.innerHTML = ''
  activity.forEach(item => { const row = document.createElement('div'); row.className = 'activity-row'; const dot = document.createElement('i'); dot.className = `activity-dot ${item.type}`; const text = document.createElement('div'); const strong = document.createElement('b'); strong.textContent = item.title; const span = document.createElement('span'); span.textContent = item.detail; text.append(strong, span); const time = document.createElement('time'); time.textContent = item.time; row.append(dot, text, time); list.append(row) })
}
function openModal(kind) {
  const modal = $('#modal'), options = $('#wallet-options'); options.innerHTML = ''; modal.dataset.kind = kind
  const entries = kind === 'evm' ? evmProviders : walletRegistry.get()
  $('#modal-title').textContent = kind === 'evm' ? 'Choose an EVM wallet.' : 'Choose a Solana wallet.'
  $('#modal-desc').textContent = kind === 'evm' ? 'Select the browser wallet for Rome Hadrian.' : 'Select a wallet registered with Solana Wallet Standard.'
  $('#modal-note').textContent = kind === 'evm' ? 'Wallets are discovered through EIP-6963, with a legacy injected-provider fallback.' : 'A wallet may connect and show its balance even if it cannot yet sign Rome v1 transactions.'
  let list = entries
  if (kind === 'evm' && !list.length && window.ethereum?.request) list = [{ info: { name: 'Injected wallet' }, provider: window.ethereum }]
  if (!list.length) { const empty = document.createElement('div'); empty.className = 'wallet-empty'; empty.textContent = kind === 'evm' ? 'No EVM wallet detected. Install or unlock a browser wallet, then refresh.' : 'No Solana Wallet Standard wallet detected. Install or unlock a compatible wallet, then refresh.'; options.append(empty) }
  list.forEach((entry, index) => {
    const button = document.createElement('button'); button.className = 'wallet-choice'; const mark = document.createElement('i'); mark.textContent = kind === 'evm' ? 'Ξ' : '◎'; const name = document.createElement('b'); name.textContent = kind === 'evm' ? (entry.info?.name || `EVM wallet ${index + 1}`) : entry.name; const hint = document.createElement('small'); hint.textContent = kind === 'evm' ? (entry.info?.rdns || 'EIP-1193') : 'Solana Wallet Standard'; const arrow = document.createElement('span'); arrow.textContent = '↗'; button.append(mark, name, hint, arrow); button.onclick = () => kind === 'evm' ? connectEvm(entry) : connectSolana(entry); options.append(button)
  })
  modal.classList.remove('hidden')
}
function closeModal() { $('#modal').classList.add('hidden') }

async function ensureRome(provider) {
  const getChain = () => provider.request({ method: 'eth_chainId' })
  if (String(await getChain()).toLowerCase() === ROME.chainIdHex) return
  let failure
  try { await provider.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: ROME.chainIdHex }] }) } catch (e) { failure = e }
  if (String(await getChain()).toLowerCase() === ROME.chainIdHex) return
  const message = String(failure?.message || '').toLowerCase()
  const addNeeded = [4902, -32603].includes(failure?.code) || /unrecognized chain|unknown chain|chain not found|not added/.test(message)
  if (!addNeeded) throw failure || new Error('Could not switch to Rome Hadrian.')
  await provider.request({ method: 'wallet_addEthereumChain', params: [{ chainId: ROME.chainIdHex, chainName: ROME.name, nativeCurrency: ROME.currency, rpcUrls: [ROME.rpc], blockExplorerUrls: [ROME.explorer] }] })
  if (String(await getChain()).toLowerCase() !== ROME.chainIdHex) await provider.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: ROME.chainIdHex }] })
  if (String(await getChain()).toLowerCase() !== ROME.chainIdHex) throw new Error('Rome was added but is not selected. Select Rome Hadrian in your wallet and reconnect.')
}
async function refreshEvmBalance() {
  if (!evmSession) return
  const provider = new ethers.BrowserProvider(evmSession.provider, 'any')
  const balance = await provider.getBalance(evmSession.address)
  $('#evm-balance').textContent = `${Number(ethers.formatUnits(balance, 18)).toFixed(6)} USDC`
}
async function connectEvm(entry) {
  try {
    closeModal(); notify(`Connecting ${entry.info?.name || 'wallet'}…`)
    const provider = entry.provider; const accounts = await provider.request({ method: 'eth_requestAccounts' })
    if (!accounts?.length) throw new Error('Wallet returned no account.')
    await ensureRome(provider)
    if (String(await provider.request({ method: 'eth_chainId' })).toLowerCase() !== ROME.chainIdHex) throw new Error('Rome Hadrian is not selected.')
    evmSession = { provider, address: accounts[0], name: entry.info?.name || 'EVM wallet' }
    $('#evm-address').textContent = short(accounts[0]); $('#evm-address').title = accounts[0]
    $('#evm-status').textContent = `● ${evmSession.name} · Rome Hadrian`; $('#evm-status').classList.add('connected')
    $('#connect-evm').classList.add('hidden'); $('#disconnect-evm').classList.remove('hidden')
    await refreshEvmBalance(); log('EVM wallet connected', `${evmSession.name} · ${short(accounts[0])}`, 'evm'); notify('Connected to Rome Hadrian.', 'success')
    provider.on?.('accountsChanged', async next => { if (!next?.length) return disconnectEvm(); evmSession.address = next[0]; $('#evm-address').textContent = short(next[0]); $('#evm-address').title = next[0]; await refreshEvmBalance().catch(e => notify(errorText(e), 'error')) })
    provider.on?.('chainChanged', async chain => { if (String(chain).toLowerCase() !== ROME.chainIdHex) { $('#evm-status').textContent = '● Wrong network · switch to Rome'; $('#evm-status').classList.remove('connected'); $('#evm-balance').textContent = '— USDC' } else { $('#evm-status').textContent = `● ${evmSession.name} · Rome Hadrian`; $('#evm-status').classList.add('connected'); refreshEvmBalance().catch(() => {}) } })
  } catch (e) { console.error(e); notify(errorText(e), 'error') }
}
function disconnectEvm() { evmSession = null; $('#evm-address').textContent = 'Connect an EVM wallet to begin'; $('#evm-balance').textContent = '— USDC'; $('#evm-status').textContent = '● Not connected'; $('#evm-status').classList.remove('connected'); $('#connect-evm').classList.remove('hidden'); $('#disconnect-evm').classList.add('hidden'); log('EVM session disconnected', 'Wallet permissions are managed by the wallet.') }
async function refreshSolBalance() { if (!solSession) return; const balance = await solanaConnection.getBalance(new PublicKey(solSession.account.address)); $('#sol-balance').textContent = `${(balance / 1e9).toFixed(4)} SOL` }
async function connectSolana(wallet) {
  try {
    closeModal(); const connectFeature = wallet.features?.['standard:connect']; if (!connectFeature?.connect) throw new Error('Wallet does not support standard:connect.')
    const result = await connectFeature.connect(); const account = result.accounts?.[0]; if (!account?.address) throw new Error('Wallet returned no Solana account.')
    solSession = { wallet, account }; $('#sol-address').textContent = short(account.address); $('#sol-address').title = account.address
    $('#sol-status').textContent = `● ${wallet.name} · Solana devnet`; $('#sol-status').classList.add('connected')
    $('#connect-sol').classList.add('hidden'); $('#disconnect-sol').classList.remove('hidden')
    const canSign = wallet.features?.['solana:signMessage']?.signMessage && wallet.features?.['solana:signTransaction']?.signTransaction
    $('#write-sol').disabled = !canSign
    await refreshSolBalance(); log('Solana wallet connected', `${wallet.name} · ${short(account.address)}`, 'sol'); notify('Solana wallet connected.', 'success')
  } catch (e) { console.error(e); notify(errorText(e), 'error') }
}
function disconnectSolana() { solSession = null; $('#sol-address').textContent = 'Connect a Solana wallet to begin'; $('#sol-balance').textContent = '— SOL'; $('#sol-status').textContent = '● Not connected'; $('#sol-status').classList.remove('connected'); $('#connect-sol').classList.remove('hidden'); $('#disconnect-sol').classList.add('hidden'); $('#write-sol').disabled = false; log('Solana session disconnected', 'Wallet permissions are managed by the wallet.') }
async function refreshMessage() { $('#message').textContent = 'Reading Rome state…'; try { const contract = new ethers.Contract(CONTRACT, ABI, readProvider); $('#message').textContent = await contract.message() } catch (e) { $('#message').textContent = `Read failed: ${errorText(e)}` } }
async function writeEvm() {
  const output = $('#evm-result')
  try {
    if (!evmSession) throw new Error('Connect an EVM wallet first.')
    if (String(await evmSession.provider.request({ method: 'eth_chainId' })).toLowerCase() !== ROME.chainIdHex) throw new Error('Switch your wallet to Rome Hadrian first.')
    const value = $('#evm-input').value.trim(); if (!value) throw new Error('Enter a message first.')
    $('#write-evm').disabled = true; output.textContent = 'Waiting for wallet confirmation…'
    const data = iface.encodeFunctionData('setMessage', [value])
    const hash = await submitRomeTx(evmSession.provider, { from: evmSession.address, to: CONTRACT, data })
    output.textContent = `Submitted ${short(hash)}`; log('EVM write submitted', short(hash), 'evm')
    const receipt = await readProvider.waitForTransaction(hash, 1, 120000); if (!receipt || receipt.status !== 1) throw new Error('Rome transaction failed.')
    await refreshMessage(); output.textContent = `Confirmed · ${short(hash)}`; log('Shared state updated from EVM', 'The Rome contract message changed.', 'success'); notify('EVM write confirmed.', 'success')
  } catch (e) { output.textContent = errorText(e); notify(errorText(e), 'error') } finally { $('#write-evm').disabled = false }
}
async function writeSolana() {
  const output = $('#sol-result')
  try {
    if (!solSession) throw new Error('Connect a Solana wallet first.')
    const value = $('#sol-input').value.trim(); if (!value) throw new Error('Enter a message first.')
    const { wallet, account } = solSession
    const signMessageFeature = wallet.features?.['solana:signMessage']
    const signTransactionFeature = wallet.features?.['solana:signTransaction']
    if (!signMessageFeature?.signMessage || !signTransactionFeature?.signTransaction) throw new Error('This wallet does not expose the signing features Rome requires.')
    $('#write-sol').disabled = true; output.textContent = 'Preparing Rome Solana-lane transaction…'
    const signer = {
      payer: new PublicKey(account.address),
      async signAuthHash(message) {
        const bytes = typeof message === 'string' ? new TextEncoder().encode(message) : message
        const signed = await signMessageFeature.signMessage({ account, message: bytes })
        return signed[0].signature
      },
      async signV1Wire(wire) {
        const signed = await signTransactionFeature.signTransaction({ account, transaction: wire, chain: ROME.solanaChain })
        return signed[0].signedTransaction.slice(-64)
      }
    }
    const data = iface.encodeFunctionData('setMessage', [value])
    output.textContent = 'Approve the Rome authorization in your Solana wallet…'
    const result = await submitRomeTxV1({ connection: solanaConnection, proxyUrl: ROME.rpc, programId: ROME.programId, chainId: ROME.chainId, signer }, { to: CONTRACT, data })
    if (result.receipt && result.receipt.status !== '0x1') throw new Error('The Solana-lane transaction reverted on Rome.')
    await refreshMessage(); output.textContent = `Confirmed · ${short(result.hash)}${result.signature ? ` · Solana ${short(result.signature)}` : ' · relayed'}`
    log('Shared state updated from Solana', `Rome transaction ${short(result.hash)}`, 'success'); notify('Solana-lane write completed.', 'success')
  } catch (e) { console.error(e); output.textContent = errorText(e); notify(errorText(e), 'error') } finally { $('#write-sol').disabled = false }
}

window.addEventListener('eip6963:announceProvider', (event) => {
  const item = event.detail; if (!item?.provider?.request) return
  const id = item.info?.uuid || item.info?.rdns || item.info?.name
  if (!evmProviders.some(p => (p.info?.uuid || p.info?.rdns || p.info?.name) === id)) evmProviders.push(item)
})
window.dispatchEvent(new Event('eip6963:requestProvider'))
walletRegistry.on('register', () => {})
$('#connect-evm').onclick = () => openModal('evm')
$('#connect-sol').onclick = () => openModal('sol')
$('#disconnect-evm').onclick = disconnectEvm
$('#disconnect-sol').onclick = disconnectSolana
$('#close-modal').onclick = closeModal
$('#modal').addEventListener('click', e => { if (e.target === $('#modal')) closeModal() })
$('#refresh-message').onclick = refreshMessage
$('#write-evm').onclick = writeEvm
$('#write-sol').onclick = writeSolana
refreshMessage()
window.setInterval(refreshMessage, 30000)
