//@ts-ignore
import HDKey from 'hdkey'

import { publicToAddress, toChecksumAddress } from 'ethereumjs-util'

export enum Derivation {
  live = 'live', legacy = 'legacy', standard = 'standard', testnet = 'testnet'
}

export function deriveHDAccounts (publicKey: string, chainCode: string, cb: (err: any, accounts: string[] | undefined) => void) {
  try {
    const hdk = new HDKey()
    hdk.publicKey = Buffer.from(publicKey, 'hex')
    hdk.chainCode = Buffer.from(chainCode, 'hex')
    const derive = (index: number) => {
      const derivedKey = hdk.derive(`m/${index}`)
      const address = publicToAddress(derivedKey.publicKey, true)
      return toChecksumAddress(`0x${address.toString('hex')}`)
    }
    const accounts = []
    for (let i = 0; i < 100; i++) { accounts[i] = derive(i) }
    cb(null, accounts)
  } catch (e) {
    cb(e, undefined)
  }
}

const derivationPaths: { [key: string]: string } = {
  [Derivation.legacy.valueOf()]: "44'/60'/0'",
  [Derivation.standard.valueOf()]: "44'/60'/0'/0",
  [Derivation.testnet.valueOf()]: "44'/1'/0'/0"
}

export function getDerivationPath (derivation: Derivation) {
  return derivationPaths[derivation.valueOf()]
}
