import { observer } from 'mobx-react-lite';
import LoadingOverlay from '../../components/LoadingOverlay/LoadingOverlay';
import { Carousel, Avatar } from 'antd';
import classnames from 'classnames';
import globalStore from '../../components/GlobalComponent/globalStore';
import { useEffect, useState } from 'react';

const carouselItems = [
    {
        id: 0,
        imgUrl: '/sources/home-bg-1.png'
    },
    {
        id: 1,
        imgUrl: '/sources/home-bg-2.png'
    }
];

const Home = observer(() => {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setTimeout(() => {
            setLoading(false);
        }, 2000);
    }, []);

    return (
        <div className={classnames('home', { 'p-24': globalStore.isBelow1300 })}>
            <LoadingOverlay loading={loading}>
                <Carousel className="custom-carousel" autoplay={{ dotDuration: true }} autoplaySpeed={5000}>
                    {carouselItems.map((item) => {
                        return (
                            <div className="carousel-item">
                                <img src={item.imgUrl} alt="" />
                            </div>
                        );
                    })}
                </Carousel>
            </LoadingOverlay>
            <div className={classnames('flex gap-24 container', { 'flex-col': globalStore.isBelow1000 })}>
                <LoadingOverlay loading={loading}>
                    <div className="rank child-container">
                        <div className="header">
                            <Avatar src={'/sources/rank-user.png'} />
                            Bảng xếp hạng
                        </div>
                        <div className="content">
                            <div className="rank-item flex gap">
                                <div className="left">
                                    <img src="/sources/ranks/rank-frog.png" alt="" />
                                    <Avatar src={'/sources/thaydat.jpg'} />
                                </div>
                                <div className="right">
                                    <div className="name">Nguyễn Đức Đạt</div>
                                    <div className="roll-number">
                                        <b>Cosc Vương</b> | HE696969
                                    </div>
                                </div>
                            </div>
                            <div className="rank-item flex gap">
                                <div className="left">
                                    <img src="/sources/ranks/rank1.png" alt="" />
                                    <Avatar src={'/sources/thaytrong.png'} />
                                </div>
                                <div className="right">
                                    <div className="name">Hoàng Gia Trọng</div>
                                    <div className="roll-number">
                                        <b>CNY</b> | HE969696
                                    </div>
                                </div>
                            </div>
                            <div className="rank-item flex gap">
                                <div className="left">
                                    <img src="/sources/ranks/rank2.png" alt="" />
                                    <Avatar src={'/sources/thaydung.jpeg'} />
                                </div>
                                <div className="right">
                                    <div className="name">Hồ Anh Dũng</div>
                                    <div className="roll-number">HE969696</div>
                                </div>
                            </div>
                            <div className="rank-item flex gap">
                                <div className="left">
                                    <img src="/sources/ranks/rank3.png" alt="" />
                                    <Avatar src={'/sources/thaylam.jpeg'} />
                                </div>
                                <div className="right">
                                    <div className="name">Phạm Ngọc Tùng Lâm</div>
                                    <div className="roll-number">HE969696</div>
                                </div>
                            </div>
                            <div className="rank-item flex gap">
                                <div className="left">
                                    <img src="/sources/ranks/rank10.png" alt="" />
                                    <Avatar src={'/sources/thaydat.jpg'} />
                                </div>
                                <div className="right">
                                    <div className="name">Lê Minh Chiến</div>
                                    <div className="roll-number">HE969696</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </LoadingOverlay>
                <div className="news flex-1 child-container">
                    <div className="header">
                        <Avatar src={'/sources/news.png'} />
                        Tin tức
                    </div>
                    <div className="content">
                        <div className="news-item"></div>
                    </div>
                </div>
            </div>
            <div className="submitted-exs container"></div>
        </div>
    );
});

export default Home;
