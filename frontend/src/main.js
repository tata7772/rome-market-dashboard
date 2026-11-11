
import './style.css'
import { ethers } from 'ethers'
import { submitRomeTx } from '@rome-protocol/sdk'

const CONTRACT_ADDRESS = '0xdAe249302D9b3C59071666feAAcbFfd48243c49a'
const ROME_CHAIN_ID = '0x30d4a'
const ROME_RPC = 'https://hadrian.testnet.romeprotocol.xyz/'

const BATCH_READER = '0x306d670dff7f51ae33f263f5122bd2b18d98adc7'

const FEEDS = [
  { name: 'SOL', address: '0x76b92646D63FB1AFEa687C7Dac48b437bF99C1B4' },
  { name: 'BTC', address: '0x2A6E178DC1d9B7372F187b7943B660E910957213' },
  { name: 'ETH', address: '0xFF6A4A6FE685574fb0Ba3ec2b59D4E8C1e2fEc38' },
  { name: 'JUP', address: '0xB328E64d8AA59f8231b09AfA62E67bc09Ac3BB61' }
]

const ABI = [
  'function message() view returns (string)',
  'function setMessage(string newMessage)'
]

const BATCH_ABI = [
  'function getLatestPrices(address[] adapters) view returns (tuple(address adapter,int256 answer,uint256 updatedAt,bool success)[] results)',
  'function getFeedHealth(address[] adapters) view returns (tuple(address adapter,bool isHealthy,bool isStale,bool isPaused,uint256 lastUpdate,int256 latestPrice,uint256 secondsSinceUpdate)[] results)'
]

const contractInterface = new ethers.Interface(ABI)
const readProvider = new ethers.JsonRpcProvider(ROME_RPC)

document.querySelector('#app').innerHTML = `
  <div class="container">
    <h1>Rome Market Dashboard</h1>
    <p class="subtitle">Live Oracle Data on Rome Hadrian</p>

    <div class="dashboard-header">
      <h2>Market Prices</h2>
      <button id="refreshPrices">Refresh All Prices</button>
    </div>

    <div class="price-grid">
      ${FEEDS.map(feed => `
        <div class="panel price-card">
          <h2>${feed.name} / USD</h2>
          <div class="price-value" id="price-${feed.name}">Loading...</div>
          <p class="price-time" id="time-${feed.name}">
            Checking feed health...
          </p>
        </div>
      `).join('')}
    </div>

    <p id="oracleStatus">Connecting to Rome BatchReader...</p>

    <div class="wallet-section">
      <button id="connect">Connect Wallet</button>
      <p id="account">Wallet not connected</p>

      <div class="panel">
        <h2>Network</h2>
        <p id="network">Rome Hadrian</p>
      </div>

      <div class="panel">
        <h2>Native Balance</h2>
        <p id="balance">Connect wallet to view balance</p>
        <button id="refresh">Refresh Balance</button>
      </div>

      <div class="panel">
        <h2>On-chain Message</h2>
        <p id="message">Loading...</p>
      </div>

      <div class="panel">
        <h2>Write to Rome</h2>
        <input id="newMessage" placeholder="Enter your message">
        <button id="write">Send Transaction</button>
        <p id="txHash"></p>
      </div>
    </div>

    <p id="status"></p>
  </div>
`

let provider
let signer

const status = document.querySelector('#status')

async function refreshAllPrices() {
  const button = document.querySelector('#refreshPrices')
  const oracleStatus = document.querySelector('#oracleStatus')

  button.disabled = true
  button.textContent = 'Checking...'
  oracleStatus.textContent = 'Reading all feeds through BatchReader...'

  try {
    const reader = new ethers.Contract(
      BATCH_READER,
      BATCH_ABI,
      readProvider
    )

    const addresses = FEEDS.map(feed => feed.address)

    const [prices, health] = await Promise.all([
      reader.getLatestPrices(addresses),
      reader.getFeedHealth(addresses)
    ])

    let successful = 0

    FEEDS.forEach((feed, index) => {
      const priceElement = document.querySelector(
        `#price-${feed.name}`
      )

      const timeElement = document.querySelector(
        `#time-${feed.name}`
      )

      const result = prices[index]
      const feedHealth = health[index]

      if (!result.success || result.answer <= 0) {
        priceElement.textContent = 'Unavailable'

        if (feedHealth.isPaused) {
          timeElement.textContent = 'Feed is paused'
        } else if (feedHealth.isStale) {
          timeElement.textContent = 'Feed data is stale'
        } else {
          timeElement.textContent = 'Oracle data unavailable'
        }

        timeElement.classList.add('stale')
        return
      }

      const price = Number(
        ethers.formatUnits(result.answer, 8)
      )

      const updatedAt = Number(result.updatedAt)

      priceElement.textContent =
        '$' + price.toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 6
        })

      let updateText = 'Updated: ' +
        new Date(updatedAt * 1000).toLocaleString()

      if (feedHealth.isHealthy) {
        updateText += ' — Healthy'
        timeElement.classList.remove('stale')
      } else {
        updateText += ' — Check feed health'
        timeElement.classList.add('stale')
      }

      timeElement.textContent = updateText
      successful++
    })

    oracleStatus.textContent =
      `${successful} of ${FEEDS.length} oracle feeds available`

  } catch (error) {
    oracleStatus.textContent =
      'BatchReader error: ' +
      (error.shortMessage || error.message)

    FEEDS.forEach(feed => {
      document.querySelector(`#price-${feed.name}`).textContent =
        'Unavailable'

      document.querySelector(`#time-${feed.name}`).textContent =
        'Could not read BatchReader'
    })
  }

  button.disabled = false
  button.textContent = 'Refresh All Prices'
}

async function refreshMessage() {
  try {
    const contract = new ethers.Contract(
      CONTRACT_ADDRESS,
      ABI,
      readProvider
    )

    document.querySelector('#message').textContent =
      await contract.message()
  } catch (error) {
    document.querySelector('#message').textContent =
      'Could not load message'
  }
}

async function refreshBalance() {
  if (!signer || !provider) {
    throw new Error('Connect wallet first')
  }

  const address = await signer.getAddress()
  const balance = await provider.getBalance(address)

  document.querySelector('#balance').textContent =
    Number(ethers.formatUnits(balance, 18)).toFixed(6) +
    ' native tokens'
}

document.querySelector('#refreshPrices').onclick =
  refreshAllPrices

document.querySelector('#connect').onclick = async () => {
  try {
    if (!window.ethereum) {
      throw new Error('Rabby not found')
    }

    await window.ethereum.request({
      method: 'eth_requestAccounts'
    })

    const chainId = await window.ethereum.request({
      method: 'eth_chainId'
    })

    if (chainId !== ROME_CHAIN_ID) {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: ROME_CHAIN_ID }]
      })
    }

    provider = new ethers.BrowserProvider(window.ethereum)
    signer = await provider.getSigner()

    document.querySelector('#account').textContent =
      await signer.getAddress()

    document.querySelector('#network').textContent =
      'Rome Hadrian — Connected'

    await refreshBalance()
    status.textContent = 'Wallet connected successfully!'

  } catch (error) {
    status.textContent = error.shortMessage || error.message
  }
}

document.querySelector('#refresh').onclick = async () => {
  try {
    await refreshBalance()
    status.textContent = 'Balance updated'
  } catch (error) {
    status.textContent = error.message
  }
}

document.querySelector('#write').onclick = async () => {
  try {
    if (!signer) {
      throw new Error('Connect wallet first')
    }

    const newMessage = document
      .querySelector('#newMessage')
      .value.trim()

    if (!newMessage) {
      throw new Error('Enter a message')
    }

    const from = await signer.getAddress()

    const data = contractInterface.encodeFunctionData(
      'setMessage',
      [newMessage]
    )

    status.textContent = 'Waiting for Rabby confirmation...'

    const hash = await submitRomeTx(window.ethereum, {
      from,
      to: CONTRACT_ADDRESS,
      data
    })

    document.querySelector('#txHash').textContent =
      'Transaction: ' + hash

    status.textContent = 'Waiting for confirmation...'

    const receipt = await provider.waitForTransaction(hash)

    if (!receipt || receipt.status !== 1) {
      throw new Error('Transaction failed')
    }

    await refreshMessage()
    status.textContent = 'Success! Message updated on Rome.'

  } catch (error) {
    status.textContent = error.shortMessage || error.message
  }
}

refreshAllPrices()
refreshMessage()

if (window.ethereum) {
  window.ethereum.on('accountsChanged', () => location.reload())
  window.ethereum.on('chainChanged', () => location.reload())
}
