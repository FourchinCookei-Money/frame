import React from 'react'
import ReactDOM from 'react-dom'
import Restore from 'react-restore'

import Panel from './App/Panel'

import link from './link'
import _store from './store'

document.addEventListener('dragover', e => e.preventDefault())
document.addEventListener('drop', e => e.preventDefault())
window.eval = global.eval = () => { throw new Error(`This app does not support window.eval()`) } // eslint-disable-line

link.rpc('getState', (err, state) => {
  if (err) return console.error('Could not get initial state from main.')
  let store = _store(state)
  if (store('main.alphaWarningPassed') === false) store.notify('mainnet')
  const Frame = Restore.connect(Panel, store)
  ReactDOM.render(<Frame />, document.getElementById('frame'))
})
document.addEventListener('mouseout', e => { if (e.clientX < 0) link.send('tray:mouseout') })
document.addEventListener('contextmenu', e => link.send('tray:contextmenu', e.clientX, e.clientY))
