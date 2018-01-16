import { h, Component } from 'preact';
import PropTypes from 'prop-types';
import AutoSizer from 'react-virtualized/dist/commonjs/AutoSizer';
import CellMeasurer, {
  CellMeasurerCache,
} from 'react-virtualized/dist/commonjs/CellMeasurer';
import InfiniteLoader from 'react-virtualized/dist/commonjs/InfiniteLoader';
import List from 'react-virtualized/dist/commonjs/List';
import LoadingIndicator from './LoadingIndicator';
import Tweet from './Tweet';
import styles from './TweetList.css';

export default class TweetList extends Component {
  _cache = new CellMeasurerCache({ defaultHeight: 35, fixedWidth: true });
  _mostRecentWidth = 0;
  _resizeAllFlag = false;

  static propTypes = {
    authenticated: PropTypes.bool.isRequired,
    disableMedia: PropTypes.bool.isRequired,
    fetchTweets: PropTypes.func.isRequired,
    tweet: PropTypes.object.isRequired
  };

  componentDidUpdate(prevProps, prevState) {
    if (
      this._resizeAllFlag ||
      this.props.disableMedia !== prevProps.disableMedia
    ) {
      this._resizeAllFlag = false;
      this._cache.clearAll();
      if (this._list) {
        this._list.recomputeRowHeights();
      }
    } else if (this.props.tweets !== prevProps.tweets) {
      const index = prevProps.tweets.length;
      this._cache.clear(index, 0);
      if (this._list) {
        this._list.recomputeRowHeights(index);
      }
    }
  }

  handleClearCache = () => {
    this._cache.clearAll();
    this._list.recomputeRowHeights();
  }

  render() {
    const { fetchTweets, tweets } = this.props;

    return (
      <div className={styles.TweetList}>
        <button onClick={this.handleClearCache}>Clear Cache</button>
        <InfiniteLoader
          isRowLoaded={this._isRowLoaded}
          loadMoreRows={fetchTweets}
          rowCount={tweets.length + 1}
        >
          {({ onRowsRendered, registerChild }) => (
            <AutoSizer>
              {({ height, width }) => {
                if (this._mostRecentWidth && this._mostRecentWidth !== width) {
                  this._resizeAllFlag = true;

                  setTimeout(this._resizeAll, 0);
                }

                this._mostRecentWidth = width;
                this._registerList = registerChild;

                return (
                  <List
                    deferredMeasurementCache={this._cache}
                    height={height}
                    onRowsRendered={onRowsRendered}
                    overscanRowCount={1}
                    ref={this._setListRef}
                    rowCount={tweets.length + 1}
                    rowHeight={this._cache.rowHeight}
                    rowRenderer={this._rowRenderer}
                    width={width}
                  />
                );
              }}
            </AutoSizer>
          )}
        </InfiniteLoader>
      </div>
    );
  }

  _isRowLoaded = ({ index }) => {
    return index < this.props.tweets.length;
  };

  _rowRenderer = ({ index, isScrolling, key, parent, style }) => {
    const { authenticated, disableMedia, tweets } = this.props;

    let content;

    if (index >= tweets.length) {
      content = <LoadingIndicator />;
    } else {
      const tweet = tweets[index];
      content = (
        <Tweet
          authenticated={authenticated}
          disableMedia={disableMedia}
          isScrolling={isScrolling}
          tweet={tweet}
        />
      );
    }

    return (
      <CellMeasurer
        cache={this._cache}
        columnIndex={0}
        key={key}
        parent={parent}
        rowIndex={index}
        width={this._mostRecentWidth}
      >
        <div className={styles.tweet} style={style}>
          {content}
        </div>
      </CellMeasurer>
    );
  };

  _resizeAll = () => {
    this._resizeAllFlag = false;
    this._cache.clearAll();
    if (this._list) {
      this._list.recomputeRowHeights();
    }
  };

  _setListRef = ref => {
    this._list = ref;
    this._registerList(ref);
  };
}
