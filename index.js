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

app.post('/api/v1/pedido', async (req, res) => {
  try {
    const { numero, cliente } = req.body;

    const pedidoQuery = await db.collection('pedido').where('numero', '==', numero).get();

    if (!pedidoQuery.empty) {
      return res.status(400).json({ message: 'Pedido já existe.' });
    }

    const novoPedidoRef = await db.collection('pedido').add({ numero, cliente });

    return res.status(201).json({ message: 'Pedido inserido com sucesso.', id: novoPedidoRef.id });
  } catch (error) {
    console.error('Erro ao processar a requisição:', error);
    return res.status(500).json({ message: 'Erro interno do servidor.' });
  }
});

app.get('/api/v1/pedido/item', async (req, res) => {
  try {
    const produtoQuery = req.query.produto;
    const page = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.perPage) || 10;

    const itemPedidoRef = db.collection('itemPedido');

    const snapshot = await itemPedidoRef
      .where('produto', '>=', produtoQuery)
      .limit(perPage)
      .offset((page - 1) * perPage)
      .get();

    const itensPedido = [];
    snapshot.forEach(doc => {
      const itemPedido = doc.data();
      const id = doc.id;
      itensPedido.push({ ...itemPedido, id });
    });

    return res.status(200).json({ itensPedido, page, total: snapshot.size });
  } catch (error) {
    console.error('Erro ao processar a requisição:', error);
    return res.status(500).json({ message: 'Erro interno do servidor.' });
  }
});

app.get('/api/v1/pedido/:numero', async (req, res) => {
  try {
    const numero = req.params.numero;

    const pedidoQuery = await db.collection('pedido').where('numero', '==', parseInt(numero)).get();

    if (pedidoQuery.empty) {
      return res.status(404).json({ message: 'Pedido não encontrado.' });
    }

    const pedido = pedidoQuery.docs[0].data();
    const id = pedidoQuery.docs[0].id;

    return res.status(200).json({ ...pedido, id });
  } catch (error) {
    console.error('Erro ao processar a requisição:', error);
    return res.status(500).json({ message: 'Erro interno do servidor.' });
  }
});

app.get('/api/v1/pedido', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.perPage) || 10;

    const pedidosRef = db.collection('pedido');

    const snapshot = await pedidosRef.limit(perPage).offset((page - 1) * perPage).get();

    const pedidos = [];
    snapshot.forEach(doc => {
      const pedido = doc.data();
      const id = doc.id;
      pedidos.push({ ...pedido, id });
    });

    const totalRegistros = await pedidosRef.get().then(snapshot => snapshot.size);

    const hasNextPage = page * perPage < totalRegistros;

    return res.status(200).json({ pedidos, page, total: totalRegistros, has_next_page: hasNextPage });
  } catch (error) {
    console.error('Erro ao processar a requisição:', error);
    return res.status(500).json({ message: 'Erro interno do servidor.' });
  }
});

app.post('/api/v1/pedido/:numero/item', async (req, res) => {
  try {
    const numeroPedido = req.params.numero;
    const { indice, sku, produto, preco, quantidade } = req.body;
    const numeroPedidoParsed = Number(numeroPedido);

    const pedidoQuery = db.collection('pedido').where('numero', '==', numeroPedidoParsed);
    const pedidoSnapshot = await pedidoQuery.get();

    if (pedidoSnapshot.empty) {
      return res.status(404).json({ message: 'Pedido não encontrado.' });
    }

    await db.collection('itemPedido').add({
      numero: numeroPedidoParsed,
      indice,
      sku,
      produto,
      preco,
      quantidade
    });

    return res.status(201).json({ message: 'Item do pedido adicionado com sucesso.' });
  } catch (error) {
    console.error('Erro ao processar a requisição:', error);
    return res.status(500).json({ message: 'Erro interno do servidor.' });
  }
});

app.get('/api/v1/pedido/:numero/item/:indice', async (req, res) => {
  try {
    const numeroPedido = req.params.numero;
    const numeroPedidoParsed = Number(numeroPedido);
    const indiceItem = req.params.indice;
    const indiceItemParsed = Number(indiceItem);
    const page = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.perPage) || 10;

    const itemPedidoRef = db.collection('itemPedido');
    const query = itemPedidoRef
      .where('numero', '==', numeroPedidoParsed)
      .where('indice', '==', indiceItemParsed);

    const snapshot = await query.limit(perPage).offset((page - 1) * perPage).get();

    const itensPedido = [];
    snapshot.forEach(doc => {
      const itemPedido = doc.data();
      const id = doc.id;
      itensPedido.push({ ...itemPedido, id });
    });

    return res.status(200).json({ itensPedido, page, total: snapshot.size });
  } catch (error) {
    console.error('Erro ao processar a requisição:', error);
    return res.status(500).json({ message: 'Erro interno do servidor.' });
  }
});

app.get('/api/v1/pedido/:numero/item', async (req, res) => {
  try {
    const numeroPedido = Number(req.params.numero);
    const page = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.perPage) || 10;

    const itemPedidoRef = db.collection('itemPedido');
    const query = itemPedidoRef.where('numero', '==', numeroPedido);

    const snapshot = await query.limit(perPage).offset((page - 1) * perPage).get();

    const itensPedido = [];
    snapshot.forEach(doc => {
      const itemPedido = doc.data();
      const id = doc.id;
      itensPedido.push({ ...itemPedido, id });
    });

    return res.status(200).json({ itensPedido, page, total: snapshot.size });
  } catch (error) {
    console.error('Erro ao processar a requisição:', error);
    return res.status(500).json({ message: 'Erro interno do servidor.' });
  }
});

const port = 3000;
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});