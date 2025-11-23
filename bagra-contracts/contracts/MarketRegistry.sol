// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./Share.sol";

contract MarketRegistry is Ownable {
    struct Market {
        address yesShare;
        address noShare;
        address pythPriceFeedId;
    }

    mapping(string => Market) internal markets;

    event MarketAdded(string indexed uri, address yesShare, address noShare, address pythPriceFeedId);

    constructor() Ownable(msg.sender) {}

    function addMarket(
        string memory uri,
        string memory yesName,
        string memory yesSymbol,
        string memory noName,
        string memory noSymbol,
        address pythPriceFeedId
    ) external onlyOwner {
        require(markets[uri].yesShare == address(0), "Market already exists");

        Share yesShare = new Share(yesName, yesSymbol);
        Share noShare = new Share(noName, noSymbol);

        markets[uri] = Market({
            yesShare: address(yesShare),
            noShare: address(noShare),
            pythPriceFeedId: pythPriceFeedId
        });

        emit MarketAdded(uri, address(yesShare), address(noShare), pythPriceFeedId);
    }

    function getMarket(string memory uri) external view returns (address yesShare, address noShare, address pythPriceFeedId) {
        Market memory market = markets[uri];
        return (market.yesShare, market.noShare, market.pythPriceFeedId);
    }
    
}
