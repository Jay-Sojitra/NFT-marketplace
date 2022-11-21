import { useState, useEffect } from 'react'
import { ethers } from "ethers"
import { Row, Col, Card } from 'react-bootstrap'

function renderSoldItems(items) {
    return (
        <>
            <h2>Sold</h2>
            <Row xs={1} md={2} lg={4} className="g-4 py-3">
                {items.map((item, idx) => (
                    <Col key={idx} className="overflow-hidden">
                        <Card>
                            <Card.Img variant="top" src={item.image} />
                            <Card.Footer>
                                For {ethers.utils.formatEther(item.totalPrice)} ETH - Recieved {ethers.utils.formatEther(item.price)} ETH
                            </Card.Footer>
                        </Card>
                    </Col>
                ))}
            </Row>
        </>
    )
}
const MyListedItem = ({ marketplace, nft, account }) => {



    const [loading, setLoading] = useState(true);
    const [listedItems, setListedItems] = useState([]);
    const [soldItems, setSoldItems] = useState([]);


    const loadListedItems = async () => {
        console.log('Loading')
        const itemCount = await marketplace.itemCount();
        console.log("itemCount", itemCount);
        let listedItems = [];
        let soldItems = [];

        for (let index = 1; index <= itemCount; index++) {
            const i = await marketplace.items(index);
            console.log('item in list', i);
            console.log('account', account);
            if (i.seller.toLowerCase() === account) {
                console.log('seller', i.seller);

                const uri = await nft.tokenURI(i.tokenId);
                const response = await fetch(uri);
                const metadata = await response.json();

                const totalPrice = await marketplace.getTotalPrice(i.ItemId);

                let item = {
                    totalPrice,
                    price: i.price,
                    ItemId: i.ItemId,
                    name: metadata.name,
                    description: metadata.description,
                    image: metadata.image
                }
                listedItems.push(item);

                if (i.sold) soldItems.push(item);
            }

        }
        setLoading(false);
        setListedItems(listedItems);
        setSoldItems(soldItems);

    }

    useEffect(() => {
        loadListedItems();
    }, [])

    if (loading) return (
        <main style={{ padding: "1rem 0" }}>
            <h2>Loading...</h2>
        </main>

    )

    console.log('listedItems', listedItems);
    return (
        <div className="flex justify-center">
            {listedItems ?
                <div className="px-5 py-3 container">
                    <h2>Listed</h2>
                    <Row xs={1} md={2} lg={4} className="g-4 py-3">
                        {listedItems.map((item, idx) => (
                            <Col key={idx} className="overflow-hidden">
                                <Card>
                                    <Card.Img variant="top" src={item.image} />
                                    <h4>{item.name}</h4>
                                    
                                    <Card.Footer>{ethers.utils.formatEther(item.totalPrice)} ETH</Card.Footer>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                    {soldItems && renderSoldItems(soldItems)}
                </div>
                : (
                    <main style={{ padding: "1rem 0" }}>
                        <h2>No listed assets</h2>
                    </main>
                )}
        </div>
    );
}

export default MyListedItem
