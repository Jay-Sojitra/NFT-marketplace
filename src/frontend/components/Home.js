import { ethers } from 'ethers';
import React, { useState } from 'react'
import { useEffect } from 'react';
import { Row, Col, Card, Button } from 'react-bootstrap'

const Home = ({ marketplace, nft }) => {

    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState();
    const loadMarketplaceItems = async () => {

        const itemCount = await marketplace.itemCount()
        console.log('itemCount', itemCount);
        let items = [];
        for (let i = 1; i <= itemCount; i++) {
            const item = await marketplace.items(i);
            console.log('item' + i + " : " + item);
            if (!item.sold) {
                const uri = await nft.tokenURI(item.tokenId);
                console.log('uriiiii', uri);
                const response = await fetch(uri);
                const metadata = await response.json()
                console.log('metadata', metadata)
                const totalPrice = await marketplace.getTotalPrice(item.ItemId);
                items.push({
                    totalPrice,
                    ItemId: item.ItemId,
                    seller: item.seller,
                    name: metadata.name,
                    description: metadata.description,
                    image: metadata.image
                })
            }

        }

        console.log('modifiedItems', items)
        setLoading(false)
        setItems(items)
    }
    const buyMarketItem = async (item) => {
        await (await marketplace.purchaseItem(item.ItemId, { value: item.totalPrice })).wait()
        loadMarketplaceItems();
    }
    useEffect(() => {
        loadMarketplaceItems();
    }, []);

    if (loading) return (
        <main style={{ padding: "1rem 0" }}>
            <h2>Loading...</h2>
        </main>

    )
    console.log('items', items);

    return (
        <div className="flex justify-center">
            {items && items.length > 0 ?

                <div className="px-5 container">
                    <Row xs={1} md={2} lg={4} className="g-4 py-5">
                        {items.map((item, idx) => (
                            <Col key={idx} className="overflow-hidden">
                                <Card>
                                    <Card.Img variant="top" src={item.image} />
                                    <Card.Body color="secondary">
                                        <Card.Title>{item.name}</Card.Title>
                                        <Card.Text>
                                            {item.description}
                                        </Card.Text>
                                    </Card.Body>
                                    <Card.Footer>
                                        <div className='d-grid'>
                                            <Button onClick={() => buyMarketItem(item)} variant="primary" size="lg">
                                                Buy for {ethers.utils.formatEther(item.totalPrice)} ETH
                                            </Button>
                                        </div>
                                    </Card.Footer>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                </div>
                : (
                    <main style={{ padding: "1rem 0" }}>
                        <h2>ALL NFT ARE SOLD..</h2>
                    </main>
                )}
        </div>
    )
}

export default Home
