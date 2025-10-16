const express = require ('express');
const mysql = require ('mysql2');

const app = express();
const port = 5656;


app.listen(port, () => {
    console.log('Server running with port', port);  
})

const database = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'user123',
    database: 'store_db_c'
});
database.connect(() => {
    console.log('Database connected');
})

app.get('/products', (req, res) => {
    database.query('SELECT * FROM products', (err, results) => {
        if (err) {
            return res.status(500).send('Database query error');
        }
        res.json(results);
    });
});

app.get('/products/:id', (req, res) => {
    const productId = req.params.id;
    database.query('SELECT * FROM products WHERE id = ?', [product_id], (err, results) => {
        if (err) {
            return res.status(500).send('Database query error');
        }
        if (results.length === 0) {
            return res.status(404).send('Product not found');
        }
        res.json(results[0]);
    }   
);
});

app.post('/products', express.json(), (req, res) => {
    const { category_id, category_name, 
        product_id, product_name, price, stock_quantity, supplier_id, supplier_name, country} = req.body;
    const newProduct = { category_id, category_name,
        product_id, product_name, price, stock_quantity, supplier_id, supplier_name, country};
    database.query('INSERT INTO products SET ?', newProduct, (err, results) => {
        if (err) {
            return res.status(500).send('Database insert error');
        }
        res.status(201).send(`Product added with ID: ${results.insertId}`);
    });
});

app.put('/products/:id', express.json(), (req, res) => {
   const productId = req.params.id;
    const { category_id, category_name,
        product_id, product_name, price, stock_quantity, supplier_id, supplier_name, country} = req.body;
    const updatedProduct = { category_id, category_name,
        product_id, product_name, price, stock_quantity, supplier_id, supplier_name, country};
    database.query('UPDATE products SET ? WHERE id = ?', [updatedProduct, productId], (err, results) => {
        if (err) {
            return res.status(500).send('Database update error');
        }
        if (results.affectedRows === 0) {
            return res.status(404).send('Product not found');
        }
        res.send('Product updated successfully');
    });
});

app.delete('/products/:id', (req, res) => {
    const productId = req.params.id;
    database.query('DELETE FROM products WHERE id = ?', [productId], (err, results) => {
        if (err) {
            return res.status(500).send('Database delete error');
        }
        if (results.affectedRows === 0) {
            return res.status(404).send('Product not found');
        }
        res.send('Product deleted successfully');
    });
});

app.use((req, res) => { 
    res.status(404).send('Route not found');
});

app.get( 'products/search', (req, res) => {
    const { name, min_price, max_price } = req.query;
    let query = 'SELECT * FROM products WHERE 1=1';
    const queryParams = [];
    if (name) {
        query += ' AND product_name LIKE ?';
        queryParams.push(`%${name}%`);
    }
    if (min_price) {
        query += ' AND price >= ?';
        queryParams.push(min_price);
    }
    if (max_price) {
        query += ' AND price <= ?';
        queryParams.push(max_price);
    }
    database.query(query, queryParams, (err, results) => {
        if (err) {
            return res.status(500).send('Database query error');
        }
        res.json(results);
    });
});

async function getProductsInStock() {
    return new Promise((resolve, reject) => {
        const query = 'SELECT * FROM products WHERE stock_quantity > 0';
        database.query(query, (err, results) => {
            if (err) {
                return reject('Database query error');
            }
            resolve(results);
        });
    });
}


app.get ('api/products/details', (req, res) => {
    const query = `
        SELECT p.product_id, p.product_name, p.price, p.stock_quantity,
                c.category_name, s.supplier_name, s.country
        FROM products p
        JOIN categories c ON p.category_id = c.category_id
        JOIN suppliers s ON p.supplier_id = s.supplier_id
    `;
    database.query(query, (err, results) => {
        if (err) {
            return res.status(500).send('Database query error');
        }
        res.json(results);
    });
});

