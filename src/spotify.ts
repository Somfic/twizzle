import SpotifyApi from "spotify-web-api-node";
import config from "./config";

const spotify: SpotifyApi  = new SpotifyApi({
    clientId: config.spotify.id,
    clientSecret: config.spotify.token
});

spotify.clientCredentialsGrant()
    .then(res => spotify.setAccessToken(res.body.access_token))
    .catch(err => console.log(err));

export default spotify;