import { workerData, parentPort } from 'worker_threads'
import * as crypto from 'crypto'
import * as fs from 'fs'

interface WorkerInput {
  files: string[]
  algorithm: 'sha256' | 'md5'
}

const { files, algorithm } = workerData as WorkerInput

async function run() {
  const results: Record<string, string> = {}

  for (const filePath of files) {
    try {
      const hash = crypto.createHash(algorithm)
      const stream = fs.createReadStream(filePath, { highWaterMark: 64 * 1024 })

      for await (const chunk of stream) {
        hash.update(chunk as Buffer)
      }

      results[filePath] = hash.digest('hex')
      parentPort?.postMessage({ type: 'progress', file: filePath })
    } catch {
      results[filePath] = 'ERROR'
      parentPort?.postMessage({ type: 'error', file: filePath })
    }
  }

  parentPort?.postMessage({ type: 'complete', results })
}

run()
