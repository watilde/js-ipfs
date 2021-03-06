'use strict'

const peerId = require('peer-id')
const PeerInfo = require('peer-info')
const multiaddr = require('multiaddr')
const waterfall = require('async/waterfall')
const mafmt = require('mafmt')

/*
 * Load stuff from Repo into memory
 */
module.exports = function preStart (self) {
  return (callback) => {
    self.log('pre-start')

    waterfall([
      (cb) => self._repo.config.get(cb),
      (config, cb) => {
        const privKey = config.Identity.PrivKey

        peerId.createFromPrivKey(privKey, (err, id) => cb(err, config, id))
      },
      (config, id, cb) => {
        self._peerInfo = new PeerInfo(id)

        config.Addresses.Swarm.forEach((addr) => {
          let ma = multiaddr(addr)

          if (!mafmt.IPFS.matches(ma)) {
            ma = ma.encapsulate('/ipfs/' + self._peerInfo.id.toB58String())
          }

          self._peerInfo.multiaddrs.add(ma)
        })

        cb()
      }
    ], callback)
  }
}
