import _ from 'lodash';
import log from 'all-log';
import config from 'config';

const generateContact = (i) => {
  return {
    email: `generated${i}@batchcreated.com`,
    properties: [
      {
        property: 'firstname',
        value: `John${i}`
      },
      {
        property: 'lastname',
        value: `Doe${i}`
      },
    ],
  };
};

const generateContactsBatch = (i, batchSize) => _.times(batchSize, j => generateContact(i + j));


const throttleAsyncAction = async (interval, collection, iteratee, onSuccess = () => null, onError = () => null) => {
  let requests = 0;
  let count = 0;
  let errors = 0;
  const list = _.clone(collection);

  return new Promise(resolve => {
    const intervalId = setInterval(() => {
      if (list.length <= 0 || requests > 200) {
        clearInterval(intervalId);
        return resolve({ requests, errors });
      }
      requests++;
      const item = list.pop();
      iteratee(item)
        .then(result => console.log('Throttled success', count++) || onSuccess(result, count))
        .catch(error => console.log('Throttled failed', errors++) || onError(error, errors));
    }, interval);
  });
};

const wait = time => {
  return new Promise(resolve => {
    setTimeout(resolve, time);
  })
};

const requestTest = [
  {
    path: '/hubspot/create',
    handlers: {
      get: async ({ hubspot, query }) => {
        const batchSize = parseInt(query.batchSize) || 100;

        const batches = _.times(parseInt(query.batches) || 1, (i) => generateContactsBatch(i * batchSize, batchSize));

        const url = 'https://api.hubapi.com/contacts/v1/contact/batch';

        const body = await Promise.all(batches.map(batch => log(batch) || hubspot.makeRequest(url, 'post', batch, true)));

        return {
          body,
        };
      },
    }
  },
  {
    path: '/hubspot/purgeContacts',
    handlers: {
      get: async ({ hubspot }) => {
        const getAllUrl = 'https://api.hubapi.com/contacts/v1/lists/all/contacts/all';
        const deleteContactUrl = vid => `https://api.hubapi.com/contacts/v1/contact/vid/${vid}`;

        let hasMore = true;
        let nextVid = null;
        const results = { requests: 0, errors: 0 };

        while (hasMore) {
          const response = await hubspot.makeRequest(
            getAllUrl,
            'get',
            null,
            true,
            {
              params: {
                count: 100,
                vidOffset: nextVid,
              }
            }
          );

          hasMore = response.data['has-more'];
          nextVid = response.data['vid-offset'];

          const contactIds = response.data.contacts.map(contact => contact.vid);

          const { requests, errors } = await throttleAsyncAction(110, contactIds, contactId => {
            return hubspot.makeRequest(
              deleteContactUrl(contactId),
              'delete',
              null,
              true
            );
          });

          results.requests += requests;
          results.errors += errors;

          console.log('Results up to now', results);
          await wait(110);
        }

        return {
          body: results,
        };
      },
    },
  },
  {
    path: '/hubspot/makeRequest',
    handlers: {
      get: async ({ body, query, params, originalUrl, protocol, xhr, get, req, hubspot }) => {
        const { url, method, withToken = false } = query;

        const results = await hubspot.makeRequest(url, method, body, withToken)

        log(results);

        return {
          body: results,
        };
      },
    },
  }
];

export default requestTest;
