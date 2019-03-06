import _ from 'lodash';
import path from 'path';
import fs from 'fs';

const noValue = Symbol('noValue');

const FileCache = async (initialData = {}) => {
  const filePath = path.resolve(process.env.NODE_PATH, '../', 'oauthFileCache.json');
  console.log({ filePath });

  const saveFile = (data = {}) => {
    return new Promise((resolve, reject) => {
      const dataToWrite = typeof data !== 'string' ? JSON.stringify(data, null, 2) : data;
      fs.writeFile(filePath, dataToWrite, 'utf8', err => (err ? reject(err) : resolve()))
    })
  };

  const loadFile = () => {
    return new Promise((resolve, reject) => {
      fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
          return reject(err);
        }
        try {
          resolve(JSON.parse(data))
        } catch (error) {
          resolve({})
        }
      })
    })
  };

  const currentData = await loadFile();
  await saveFile({...initialData, ...currentData});

  const fileCacheInstance = {
    listeners: new Set,
    set: (key, userData = noValue) => {
      let newData;
      if (userData === noValue) {
        newData = key;
      } else {
        newData = { [key]: userData }
      }

      return loadFile()
        .then(oldData => ({
          oldData,
          dataToSave: {
            ...oldData || {},
            ...newData,
          }
        }))
        .then(({oldData, dataToSave}) => {
          return _.isEqual(dataToSave, oldData) ? false : dataToSave
        })
        .then(dataToSave => {
          if (dataToSave) {
            fileCacheInstance.listeners.forEach(cb => cb(dataToSave));
            return saveFile(dataToSave);
          }
          return false;
        });
    },
    get: (key) => {
      return loadFile()
        .then(fileData => {
          if (key) {
            return fileData[key];
          }
          return fileData;
        })
    },
    subscribe: cb => {
      fileCacheInstance.listeners.add(cb);
    },
    unsubscribe: cb => {
      fileCacheInstance.listeners.delete(cb);
    },
  };

  return fileCacheInstance;
};

export default FileCache;