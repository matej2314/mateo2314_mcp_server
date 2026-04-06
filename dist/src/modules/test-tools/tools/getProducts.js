const productsDatabase = {
    electronics: [
        {
            id: 'e001',
            name: 'Laptop Pro 15',
            price: 4999.99,
            currency: 'PLN',
            inStock: true,
            rating: 4.7,
            reviews: 234,
            specs: {
                processor: 'Intel i7',
                ram: '16GB',
                storage: '512GB SSD',
            },
        },
        {
            id: 'e002',
            name: 'Wireless Mouse',
            price: 129.99,
            currency: 'PLN',
            inStock: true,
            rating: 4.5,
            reviews: 892,
            specs: {
                connectivity: 'Bluetooth 5.0',
                battery: '6 months',
                dpi: '4000',
            },
        },
        {
            id: 'e003',
            name: 'USB-C Hub',
            price: 199.99,
            currency: 'PLN',
            inStock: false,
            rating: 4.3,
            reviews: 156,
            specs: {
                ports: '7 ports',
                power: '100W PD',
                compatibility: 'Universal',
            },
        },
    ],
    books: [
        {
            id: 'b001',
            name: 'Clean Code',
            price: 89.99,
            currency: 'PLN',
            inStock: true,
            rating: 4.9,
            reviews: 1523,
            details: {
                author: 'Robert C. Martin',
                pages: 464,
                language: 'English',
            },
        },
        {
            id: 'b002',
            name: 'Design Patterns',
            price: 119.99,
            currency: 'PLN',
            inStock: true,
            rating: 4.8,
            reviews: 987,
            details: {
                author: 'Gang of Four',
                pages: 395,
                language: 'English',
            },
        },
    ],
    clothing: [
        {
            id: 'c001',
            name: 'Cotton T-Shirt',
            price: 49.99,
            currency: 'PLN',
            inStock: true,
            rating: 4.4,
            reviews: 445,
            details: {
                material: '100% Cotton',
                sizes: ['S', 'M', 'L', 'XL'],
                colors: ['black', 'white', 'navy'],
            },
        },
        {
            id: 'c002',
            name: 'Denim Jeans',
            price: 199.99,
            currency: 'PLN',
            inStock: true,
            rating: 4.6,
            reviews: 678,
            details: {
                material: 'Denim',
                fit: 'Slim',
                colors: ['blue', 'black'],
            },
        },
    ],
};
export async function getProductsTool(args) {
    const category = args.category;
    const limit = args.limit || 5;
    let products = [];
    if (category && productsDatabase[category]) {
        products = productsDatabase[category];
    }
    else {
        products = [
            ...productsDatabase.electronics,
            ...productsDatabase.books,
            ...productsDatabase.clothing,
        ];
    }
    const limitedProducts = products.slice(0, limit);
    const response = {
        category: category || 'all',
        totalFound: products.length,
        returned: limitedProducts.length,
        products: limitedProducts,
        metadata: {
            timestamp: new Date().toISOString(),
            availableCategories: Object.keys(productsDatabase),
        },
    };
    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify(response, null, 2),
            },
        ],
    };
}
