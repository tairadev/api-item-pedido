const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const bodyParser = require('body-parser');
const { applicationDefault, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp, FieldValue, Filter } = require('firebase-admin/firestore');
var admin = require('firebase-admin');

var serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = getFirestore();

const app = express();

app.use(morgan('dev'))
app.use(bodyParser.urlencoded({ extended: false }))
app.use(express.json())
app.use(cors())

app.listen(21262, () => {
  console.log('Express started at http://localhost:21262')
})

app.post('/api/v1/pedido', (req, res) => {
  const novoPedido = req.body;
  admin.firestore()
    .collection('pedido')
    .get()
    .then(snapshot => {
      const pedidos = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      if (novoPedido && novoPedido.numero && novoPedido.cliente && !pedidos.find((pedido) => pedido.numero.toString() === novoPedido.numero.toString())) {
        const pedido = {
          numero: novoPedido.numero,
          cliente: novoPedido.cliente,
        }
        db.collection('pedido').doc().set(pedido)
          .then(() => {
            return res.send({ status: 'OK', response: 'Pedido inserido com sucesso!' });
          }).catch(() => {
            return res.send({ status: 'ERRO', response: 'Ocorreu um erro ao inserir seu pedido!' });
          });
      } else {
        return res.send({ status: 'ERRO', response: 'Ocorreu um erro ao inserir seu pedido!' });
      }
    }).catch(() => {
      return res.send({ status: 'ERRO', response: 'Ocorreu um erro ao inserir seu pedido!' });
    });

})

app.get('/api/v1/pedido/item', (req, res) => {
  const produto = req.query.produto;
  if (produto && produto !== '') {
    admin.firestore()
    .collection('itemPedido')
    .get()
    .then(snapshot => {
      const pedidos = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).filter((item) => item.produto.toLowerCase().includes(produto.toLowerCase()));
      return res.send(pedidos || [])
    }).catch(() => {
      return res.send({ status: 'ERRO', response: 'Ocorreu um erro ao inserir seu pedido!' });
    });
  }
  return [];
})

app.get('/api/v1/pedido/:nPedido', (req, res) => {
  const nPedido = req.params.nPedido;
  admin.firestore()
    .collection('pedido')
    .get()
    .then(snapshot => {
      const pedidos = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).find((pedido) => pedido.numero.toString() === nPedido.toString())
      return res.send(pedidos || {})
    }).catch(() => {
      return res.send({ status: 'ERRO', response: 'Ocorreu um erro ao inserir seu pedido!' });
    });
})

app.get('/api/v1/pedido', (req, res) => {
  admin.firestore()
    .collection('pedido')
    .get()
    .then(snapshot => {
      const pedidos = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      return res.send(pedidos)
    }).catch(() => {
      return res.send({ status: 'ERRO', response: 'Ocorreu um erro ao inserir seu pedido!' });
    });
})

app.post('/api/v1/pedido/:nPedido/item', (req, res) => {
  const nPedido = req.params.nPedido;
  admin.firestore()
    .collection('pedido')
    .get()
    .then(snapshot => {
      const pedidos = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      if(nPedido && pedidos.find((pedido) => pedido.numero.toString() === nPedido.toString())) {
        const novoItem = req.body;
        if(novoItem && novoItem.indice && novoItem.sku && novoItem.produto && novoItem.preco && novoItem.quantidade) {
          const novoItemPedido = {
            numero: nPedido,
            indice: novoItem.indice,
            sku: novoItem.sku,
            produto: novoItem.produto,
            preco: novoItem.preco,
            quantidade: novoItem.quantidade,
          }
          db.collection('itemPedido').doc().set(novoItemPedido)
          .then(() => {
            return res.send({ status: 'OK', response: 'Pedido inserido com sucesso!' });
          }).catch(() => {
            return res.send({ status: 'ERRO', response: 'Ocorreu um erro ao inserir seu pedido!' });
          });
        } else {
          return res.send({ status: 'ERRO', response: 'Ocorreu um erro ao cadastrar um pedido!' });
        }
      } else {
        return res.send({ status: 'ERRO', response: 'Número do pedido não encontrado!' });
      }
    }).catch(() => {
      return res.send({ status: 'ERRO', response: 'Ocorreu um erro ao inserir seu pedido!' });
    });
})

app.get('/api/v1/pedido/:nPedido/item/:indiceItem', (req, res) => {
  const nPedido = req.params.nPedido;
  const indiceItem = req.params.indiceItem;
  admin.firestore()
    .collection('itemPedido')
    .get()
    .then(snapshot => {
      const pedidos = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).filter((item) => item.indice.toString() === indiceItem.toString() && item.numero.toString() === nPedido.toString());
      return res.send(pedidos)
    }).catch(() => {
      return res.send({ status: 'ERRO', response: 'Ocorreu um erro ao inserir seu pedido!' });
    });
})

app.get('/api/v1/pedido/:nPedido/item', (req, res) => {
  const nPedido = req.params.nPedido;
  admin.firestore()
    .collection('itemPedido')
    .get()
    .then(snapshot => {
      const pedidos = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).filter((item) => item.numero.toString() === nPedido.toString());
      return res.send(pedidos || [])
    }).catch(() => {
      return res.send({ status: 'ERRO', response: 'Ocorreu um erro ao inserir seu pedido!' });
    });
})