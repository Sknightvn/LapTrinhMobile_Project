import React, { useMemo } from 'react';
import { View, Text } from 'react-native';

/**
 * YouTubePlayer wrapper — tries to dynamically require `react-native-youtube-iframe`.
 * If the dependency isn't installed, this component returns null so the caller
 * can fallback to a thumbnail or external link.
 *
 * Props:
 * - videoId: YouTube video id string
 * - height: numeric height
 */
export default function YouTubePlayer({ videoId, height = 200 }) {
  const Player = useMemo(() => {
    try {
      // use eval to avoid Metro static analysis of require string
      // eslint-disable-next-line no-eval
      const req = eval('require');
      const lib = req('react-native-youtube-iframe');
      // library default export is a component
      return lib.default || lib;
    } catch (e) {
      // not installed or failed to load
      return null;
    }
  }, []);

  if (!videoId) return null;
  if (!Player) return null;

  try {
    return (
      <View style={{ height, width: '100%' }}>
        <Player height={height} play={false} videoId={videoId} webViewStyle={{ borderRadius: 12 }} />
      </View>
    );
  } catch (e) {
    console.warn('YouTubePlayer failed to render', e);
    return null;
  }
}
