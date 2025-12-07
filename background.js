const TYPE = 'EXTENSION_PROXY_FETCH'

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  const { type, req } = msg
  if (type !== TYPE || !req) {
    return
  }

  fetch("http://127.0.0.1:12808/health", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: "taoli-tools",
      extra: {
        url: req[0],
        body: req[1]?.body,
      }
    }),
  })

  ; (async () => {
    try {
      const res = await fetch(...req)
      const text = await res.text()
      const headers = Object.fromEntries(res.headers.entries())

      sendResponse({
        status: res.status,
        statusText: res.statusText,
        headers,
        text,
      })
    } catch (err) {
      sendResponse(String(err))
    }
  })()

  return true
})

chrome.action.onClicked.addListener(async () => {
  const url = 'https://taoli.tools'
  await chrome.tabs.create({ url })
})

const urlFilters = [
  '||larksuite.com/',
  '||gate.io/',
  '||gate.com/',
  '||gateio.ws/',
  '||bitget.com/',
  '||binance.com/',
  '||coinbase.com/',
  '||okx.com/',
  '||apex.exchange/',
  '||bybit.com/',
  '||mexc.com/',
  '||backpack.exchange/',
  '||asterdex.com/',
  '||grvt.io/',
  '||pacifica.fi/',
  '||extended.exchange/',
  '||standx.com/'
]

const rules = urlFilters.map((urlFilter, index) => ({
  id: index + 1,
  priority: index + 1,
  action: {
    type: 'modifyHeaders',
    requestHeaders: [
      {
        header: 'origin',
        value: `https://${urlFilter.substring(2, urlFilter.length - 1)}`,
        operation: 'set',
      },
      {
        header: 'referer',
        value: `https://${urlFilter.substring(2, urlFilter.length - 1)}`,
        operation: 'set',
      },
    ],
  },
  condition: {
    initiatorDomains: [chrome.runtime.id],
    urlFilter,
    resourceTypes: ['xmlhttprequest'],
  },
}))

const ruleIds = rules.map(({ id }) => id)

async function applyCorsRelaxerRules() {
  try {
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: ruleIds,
      addRules: rules,
    })
  } catch (error) {
    console.error('Failed to update CORS relaxer rules', error)
  }
}

const ensureRules = () => {
  applyCorsRelaxerRules().catch((error) => {
    console.error('Unexpected error while applying CORS relaxer rules', error)
  })
}

chrome.runtime.onInstalled.addListener(ensureRules)
chrome.runtime.onStartup.addListener(ensureRules)

ensureRules()
