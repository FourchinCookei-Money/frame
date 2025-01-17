const { create } = require('ipfs-http-client')

// if there is an ipfs endpoint in the store use that otherwise use pylon
let node

const connect = async () => {
  try {
    // TODO: use nebula for this or make it configurable somewhere
    // const endpointConfig = process.env.NODE_ENV === 'production'
    node = create({
      host: 'ipfs.nebula.land',
      port: 443,
      protocol: 'https'
    })

    // const connectPeers = async () => {
    //   // const peers = await ens.resolvePeers('frame.eth')
    //   for (const peer of peers) {
    //     await node.swarm.connect(peer)
    //   }
    // }
    // await connectPeers()
    // const id = await node.id()
    // console.log(id)
  } catch (e) {
    // destryo ipfs instance...

    node = null

    console.error(e)
    // ipfs.destroy()
    setTimeout(() => connect(), 15 * 1000)
  }

  // const connectPeers = async () => {
  //   // const peers = await ens.resolvePeers('frame.eth')
  //   for (const peer of peers) await node.swarm.connect(peer)
  // }
  // await connectPeers()
  // store.setIPFS(update)
  // store.setClientState('ipfs', 'ready')
}

connect()


// const surface = {
//   getStream: async path => {
//     // if (!node) throw new Error(`IPFS is not running`)
//     // console.log(node)
//     // return node.getReadableStream(path)

//     if (!node) throw new Error(`IPFS is not running`)
//     const files = []
//     for await (const file of node.get(path)) {
//       if (!file.content) continue
//       let content = Buffer.from('')
//       console.log(file.path)
//       for await (const data of file.content) {
//         content = Buffer.concat([content, Buffer.from(data)])
//       }
//       file.content = content
//       console.log('  ->  Done')
//       files.push(file)
//     }
//     return files

//   },
//   get: async path => {
//     if (!node) throw new Error('IPFS is not running')
//     const files = []
//     for await (const file of node.get(path)) {
//       if (!file || !file.content) continue
//       let content = Buffer.from('')
//       for await (const data of file.content) {
//         content = Buffer.concat([content, Buffer.from(data)])
//       }
//       file.content = content
//       files.push(file)
//     }
//     return files
//   },
//   getFile: async path => {
//     if (!node) throw new Error(`IPFS is not running`)
//     console.log('ipfs getFile', path)
//     const files = await surface.get(path)
//     if (files.length > 1) throw new Error(`Path ${path} is a directory, use .get() to return all files`)
//     if (files[0].path !== path || files.length !== 1) throw new Error(`Path ${path} could not be found`)
//     return files[0]
//   }
// }

const surface = {
  get: async path => {
    if (!node) throw new Error('IPFS is not running')
    const files = []

    for await (const file of node.get(path)) {
      if (!file || !file.content) continue
      let content = Buffer.from('')
      for await (const data of file.content) {
        content = Buffer.concat([content, Buffer.from(data)])
      }
      file.content = content
      files.push(file)
    }
    return files
  },
  getFile: async path => {
    const files = await surface.get(path)
    if (files.length > 1) throw new Error(`Path ${path} is a directory, use .get() to return all files`)
    return files[0]
  },
  pin: async (cid) => {
    // console.log('Pinning', cid)
    if (!node) throw new Error('IPFS is not running')
    const result = await node.pin.add(cid)
    return result
  }
}
module.exports = surface
