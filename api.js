const Bottleneck = require("bottleneck");
const request = require("request");


class PubgTracker {
  constructor(api_key) {
    this.api_key = api_key

    // Limit the API to ~1/sec as per the request of https://pubgtracker.com/site-api
    //this.limiter = new Bottleneck(1, 1000);
    this.limiter = new Bottleneck(1, 1000);
  }

  /**
   * Retrieve the account of a player via their StreamID
   * @param {string} id The 64bit SteamID as a string
   */
  getPlayerByStreamID64(id) {

    return new Promise((resolve, reject) => {

      const options = {
        url: `https://pubgtracker.com/api/search?steamId=${id}`,
        headers: {
          'TRN-Api-Key': this.api_key
        },
        json: true
      };

      return new Promise((resolve, reject) => {
        this.limiter.submit((callback) => {
          request.get(options, callback)
        }, (err, response, body) => {
          if (err) reject(err)
          else resolve(body)
        })
      })

    })

  }

  getStatsByNickname(id) {

    return new Promise((resolve, reject) => {

      const options = {
        url: `https://pubgtracker.com/api/profile/pc/${nickname}`,
        headers: {
          'TRN-Api-Key': this.api_key
        },
        json: true
      };

      return new Promise((resolve, reject) => {
        this.limiter.submit((callback) => {
          request.get(options, callback)
        }, (err, response, body) => {
          if (err) reject(err)
          else resolve(body)
        })
      })

    })

  }

}

module.exports = PubgTracker;
