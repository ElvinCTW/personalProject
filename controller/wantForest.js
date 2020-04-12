/* eslint-disable require-jsdoc */
/* eslint-disable prefer-rest-params */
const {WantTree} = require('../util/mongoDB');

const WantForest = function(wantTreeArray) {
  if (!Array.isArray(wantTreeArray) || wantTreeArray.length === 0) return false;

  // Init
  // this.layersCount = 2;
  // this.curLayer = 1;
  this.layersOfForest =
    [wantTreeArray.map((wantTree)=>wantTree.getWantItemId())];
  this.layersOfForest.push(_getUniqleIdsForNewLayer(wantTreeArray));
  this.treeCollection = new Map();
  _insertTreeCollection(wantTreeArray);

  // this.forest
  // key : id // value : tree ?
  this.forest = wantTreeArray.reduce((acu, wantTree)=>{
    if (!acu[wantTree.getWantItemId()]) {
      acu[wantTree.getWantItemId()] = wantTree;
      return acu;
    }
  }, {});

  // Methods
  // function getLayers() {
  //   return _getLayers();
  // }
  // function _getLayers() {
  //   return this.layersCount;
  // }

  // function getCurLayer() {
  //   return _getCurLayer();
  // }
  // function _getCurLayer() {
  //   return this.curLayer;
  // }

  // async function setLayersOfItemDataUpTo(countOfPeople) {
  //   if (typeof countOfPeople !== 'number' || countOfPeople < 2) return false;
  //   this.countOfPeople = countOfPeople;
  //   for (let i = 0; i < countOfPeople; i++) {
  //     this.layersOfForest[this.curLayer+1] =
  //     await _getNextLayerData();
  //     this.layersCount++;
  //     this.curLayer++;
  //   }
  //   return true;
  // }

  // async function setLayersOfItemDataUpTo(countOfPeople) {
  //   if (typeof countOfPeople !== 'number' || countOfPeople < 2) return false;
  //   this.countOfPeople = countOfPeople;
  //   for (let i = 0; i < countOfPeople; i++) {
  //     this.layersOfForest[this.curLayer+1] =
  //       await _getNextLayerData();
  //     // this.layersCount++;
  //     // this.curLayer++;
  //   }
  //   return true;
  // }

  async function setLayersOfItemDataUpTo(countOfPeople) {
    if (typeof countOfPeople !== 'number' || countOfPeople < 2) return false;
    this.countOfPeople = countOfPeople;
    for (let i = 0; i < countOfPeople; i++) {
      this.layersOfForest[this.curLayer+1] =
        await _getNextLayerData();
      // this.layersCount++;
      // this.curLayer++;
    }
    return true;
  }

  function startMatch() {
    // DFS
    // for (let i = 0; i < this.layersOfForest[0].length; i++) {
    //   const treeCollectionKey = this.layersOfForest[0][i];
    //   const wantTree = treeCollection.get(treeCollectionKey);
    
    // }
  }

  async function _getNextLayerData() {
    // Check arguments
    const curLayerIds = this.layersOfForest[this.curLayer].slice();
    if (curLayerIds.length === 0) return [];
    try {
      const wantTreesStartFromCurIds = await new Promise((resolve, reject)=>{
        // Get data from mongoDB
        WantTree.find({wantItemId: {$in: curLayerIds}}, function(err, res) {
          if (err) {
            reject(err);
          } else {
            resolve(res);
          }
        });
      });
      _insertTreeCollection(wantTreesStartFromCurIds);
      return _getUniqleIdsForNewLayer(wantTreesStartFromCurIds);
    } catch (err) {
      console.log(err);
    }
  };

  function _getUniqleIdsForNewLayer(wantTreeArray) {
    const duplicateIdArray = wantTreeArray.reduce((acu, wantTree)=>{
      acu.concat(wantTree.getRequiredItems());
    }, []);
    return [...new Set(duplicateIdArray)];
  }

  function _insertTreeCollection(wantTreeArray) {
    wantTreeArray.forEach(function(wantTree) {
      if (!this.treeCollection.get(wantTree.getWantItemId())) {
        treeCollection.set(wantTree.getWantItemId(), wantTree);
      }
    });
  }

  return {
    getLayers,
    getCurLayer,
    setLayersOfItemDataUpTo,
    startMatch,
  };
};

module.exports = WantForest;

function LinkedList() {
  this.head = null;
  this.count = 0;

  function Node(val) {
    this.val = val;
    this.next = null;
  }

  function appendNode(val) {
    return _appendNode(val);
  }
  function _appendNode(val) {
    if (!val) return false;
    if (!head) {
      head = new Node(val);
    } else {
      const newNode = new Node(val);
      newNode.next = head;
      head = newNode;
    }
    count++;
    return true;
  };

  function getLength() {
    return _getLength();
  }
  function _getLength() {
    return count;
  }

  return {
    appendNode,
    getLength,
  };
};
