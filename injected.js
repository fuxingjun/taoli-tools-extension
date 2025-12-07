; (() => {
  globalThis.TaoliToolsExtension = {}
  
  // 读取 indexedDB(bucket name 为 default) 中的交易对 (pairs) 并发送到本地服务器
  async function getPairsFromDB() {
    const dbName = "database" // IndexedDB 数据库名称
    const storeName = "pairs" // 存储对象名称
    const pairs = []

    try {
      // 打开 IndexedDB 数据库
      const request = indexedDB.open(dbName)

      request.onsuccess = async function (event) {
        const db = event.target.result

        // 开启事务并获取存储对象
        const transaction = db.transaction(storeName, "readonly")
        const store = transaction.objectStore(storeName)

        // 遍历存储对象中的所有数据
        const cursorRequest = store.openCursor()
        cursorRequest.onsuccess = function (event) {
          const cursor = event.target.result
          if (cursor) {
            // let value = {
            //   "id": "09ef2679-feca-483b-b7a9-22213aa0fadc",
            //   "a": {
            //     "name": "Gate", "exchange": "Gate", "symbol": "PIGGY_USDT", "type": "perp", "base": "PIGGY", "quote": "USDT",
            //     "info": { "quanto_multiplier": "1", "order_price_deviate": "0.2" },
            //     "limit": { "priceStep": "0.0001", "sizeStep": "1", "sizeMin": "1", "sizeMax": "1000000" },
            //     "tradeUrl": "https://www.gate.com/futures/USDT/PIGGY_USDT?ref=TAOTAOLI&ref_type=103", "status": 1
            //   },
            //   "b": {
            //     "name": "OKX DEX 10", "exchange": "OKX DEX",
            //     "symbol": "BNB Chain/0x8410fea2Dd13c1798977Ff4D55A9e1835f54f216/0x55d398326f99059fF775485246999027B3197955",
            //     "type": "spot", "base": {
            //       "platform": "BNB Chain", "id": "0x8410fea2Dd13c1798977Ff4D55A9e1835f54f216", "symbol": "PIGGY",
            //       "info": { "decimals": 18 }
            //     },
            //     "quote": {
            //       "platform": "BNB Chain", "id": "0x55d398326f99059fF775485246999027B3197955", "symbol": "USDT",
            //       "info": { "decimals": 18 }
            //     },
            //     "limit": { "sizeStep": "0.000000000000000001", "sizeMin": "0.000000000000000001" },
            //     "tradeUrl": "https://web3.okx.com/token/56/0x8410fea2Dd13c1798977Ff4D55A9e1835f54f216", "status": 1
            //   }, "n": 1, "ts": 1764941034747
            // }
            const v = cursor.value
            pairs.push({
              id: v.id,
              ts: v.ts,
              a: { name: v.a.name, exchange: v.a.exchange, symbol: v.a.symbol, type: v.a.type },
              b: { name: v.b.name, exchange: v.b.exchange, symbol: v.b.symbol, type: v.b.type },
            }) // 将交易对添加到数组
            cursor.continue() // 继续下一个
          } else {
            // 遍历完成后发送数据到本地服务器
            fetch("http://127.0.0.1:12808/monitor", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(pairs),
            })
              .then((response) => {
                if (response.ok) {
                  console.log("✅ 交易对已成功发送到服务器:", pairs)
                } else {
                  console.error("❌ 发送交易对失败:", response.status)
                }
              })
              .catch((err) => {
                console.error("❌ 网络错误:", err.message)
              })
          }
        }

        cursorRequest.onerror = function (event) {
          console.error("❌ 遍历存储对象失败:", event.target.error)
        }
      }

      request.onerror = function (event) {
        console.error("❌ 无法打开 IndexedDB 数据库:", event.target.error)
      }
    } catch (err) {
      console.error("❌ 读取 IndexedDB 数据库时发生错误:", err.message)
    }
  }

  // 每1分钟执行一次
  setInterval(() => {
    getPairsFromDB()
  }, 60000)
})()
