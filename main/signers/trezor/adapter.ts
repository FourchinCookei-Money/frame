import log from 'electron-log'
import { Device as TrezorDevice } from 'trezor-connect'

import flex from '../../flex'
import { SignerAdapter } from '../adapters'
import Trezor from './Trezor'
import store from '../../store'
import Signer from '../Signer'

export default class TrezorSignerAdapter extends SignerAdapter {
  private flexListeners: { [event: string]: (device: TrezorDevice) => void };
  private knownSigners: { [id: string]: Trezor };
  private observer: any;

  constructor () {
    super('trezor')

    this.flexListeners = {}
    this.knownSigners = {}
  }

  open () {
    const connectListener = (device: TrezorDevice) => {
      const trezor = new Trezor(device)
      trezor.derivation = store('main.trezor.derivation')

      const version = [trezor.appVersion.major, trezor.appVersion.minor, trezor.appVersion.patch].join('.')
      log.info(`Trezor ${device.id} connected: ${trezor.model}, firmware v${version}`)

      trezor.on('close', () => {
        delete this.knownSigners[device.path]

        this.emit('remove', trezor.id)
      })

      trezor.on('update', () => {
        this.emit('update', trezor)
      })

      this.knownSigners[device.path] = trezor

      this.emit('add', trezor)

      trezor.open()
    }

    const disconnectListener = (device: TrezorDevice) => {
      log.info(`Trezor ${device.id} disconnected`)

      this.withSigner(device, signer => {
        signer.close()

        delete this.knownSigners[device.path]

        this.emit('remove', signer.id)
      })
    }

    const updateListener = (device: TrezorDevice) => {
      log.debug(`Trezor ${device.id} updated`)

      this.withSigner(device, signer => this.emit('update', signer))
    }

    const needPinListener = (device: TrezorDevice) => {
      log.debug(`Trezor ${device.id} needs pin`)

      this.withSigner(device, signer => {
        signer.status = 'Need Pin',
        signer.update()
      })
    }

    const needPhraseListener = (device: TrezorDevice) => {
      log.debug(`Trezor ${device.id} needs passphrase`)

      this.withSigner(device, signer => {
        signer.status = 'Enter Passphrase'
        signer.update()
      })
    }

    const scanListener = (err: any) => {
      if (err) return log.error(err)
    }

    const readyListener = () => {
      this.observer = store.observer(() => {
        const trezorDerivation = store('main.trezor.derivation')

        Object.values(this.knownSigners).forEach(trezor => {
          if (trezor.derivation !== trezorDerivation) {
            trezor.derivation = trezorDerivation
            trezor.reset()
            trezor.deviceStatus()
          }
        })
      })

      this.flexListeners = {
        'trezor:connect': connectListener,
        'trezor:disconnect': disconnectListener,
        'trezor:update': updateListener,
        'trezor:needPin': needPinListener,
        'trezor:needPhrase': needPhraseListener,
        'trezor:scan': scanListener
      }

      Object.entries(this.flexListeners).forEach(([event, listener]) => flex.on(event, listener))
    }

    flex.on('ready', readyListener)

    this.flexListeners.ready = readyListener

    super.open()
  }

  close () {
    this.observer.remove()

    Object.entries(this.flexListeners).forEach(([event, listener]) => flex.off(event, listener))

    super.close()
  }

  reload (signer: Signer) {
    signer.open()
  }

  private withSigner (device: TrezorDevice, fn: (signer: Trezor) => void) {
    const signer = this.knownSigners[device.path]

    if (signer) fn(signer)
  }
}
