import expectThrow from 'openzeppelin-solidity/test/helpers/expectThrow';
const TestToken = artifacts.require("./tokens/TestToken");
const BatchTransfer = artifacts.require("./BatchTransfer");

contract('BatchTransfer', (accounts) => {

    let owner = accounts[0];
    let receiver1 = accounts[1];
    let receiver2 = accounts[2];
    let receiver3 = accounts[3];
    let receiver4 = accounts[4];
    let receiver5 = accounts[5];
    let noAddress = "0x00000000000000000000";

    let receivers;
    let amounts;

    let token;
    let batchTransferContract;
    let allowanceAmount;
    let sendingAmount;

    beforeEach(async () => {
        token = await TestToken.new();
        batchTransferContract = await BatchTransfer.new();
    });

    describe('batchTransferToken function', () => {
        beforeEach(() => {
            allowanceAmount = 1000;
        });

        it('_receiversの長さが0でエラー', async () => {
            amounts = [1,2,3,4,5];
            receivers = [];
            await token.approve(batchTransferContract.address, allowanceAmount);

            let result = await expectThrow(batchTransferContract.batchTransferToken(token.address, receivers, amounts));
        });

        it('_tokenAmountsの長さが0でエラー', async () => {
            receivers = [receiver1, receiver2];
            amounts = [];
            await token.approve(batchTransferContract.address, allowanceAmount);

            await expectThrow(batchTransferContract.batchTransferToken(token.address, receivers, amounts));
        });

        it('_tokenのアドレスが0でエラー', async () => {
            receivers = [receiver1];
            amounts = [1];
            await token.approve(batchTransferContract.address, allowanceAmount);

            await expectThrow(batchTransferContract.batchTransferToken(noAddress, receivers, amounts));
        });

        it('_receiversの長さと_tokenAmountsの長さが異なる場合、エラー', async () => {
            receivers = [receiver1, receiver2];
            amounts = [1];
            await token.approve(batchTransferContract.address, allowanceAmount);

            await expectThrow(batchTransferContract.batchTransferToken(token.address, receivers, amounts));
        });

        it('コントラクトがmsg.senderの送信を承認されている額が送信しようとしている総額より小さかったらエラー', async () => {
            receivers = [receiver1, receiver2];
            amounts = [500, 501];
            await token.approve(batchTransferContract.address, allowanceAmount);
            await expectThrow(batchTransferContract.batchTransferToken(token.address, receivers, amounts));
        });

        it('コントラクトがmsg.senderの送信を承認されている額が送信しようとしている総額とぴったりだったらOK', async () => {
            let beforeBalanceOfReveiver1 = await token.balanceOf(receiver1);
            let beforeBalanceOfReveiver2 = await token.balanceOf(receiver2);
            let beforeBalanceOfOwner = await token.balanceOf(owner);

            receivers = [receiver1, receiver2];
            amounts = [499, 501];
            await token.approve(batchTransferContract.address, allowanceAmount);
            await batchTransferContract.batchTransferToken(token.address, receivers, amounts);

            let afterBalanceOfReveiver1 = await token.balanceOf(receiver1);
            let afterBalanceOfReveiver2 = await token.balanceOf(receiver2);
            let afterBalanceOfOwner = await token.balanceOf(owner);

            assert.equal(afterBalanceOfReveiver1 - beforeBalanceOfReveiver1, 499, "batchTransferToken doesn't work correctly1");
            assert.equal(afterBalanceOfReveiver2 - beforeBalanceOfReveiver2, 501, "batchTransferToken doesn't work correctly2");
            assert.equal(beforeBalanceOfOwner - afterBalanceOfOwner, 1000, "batchTransferToken doesn't work correctly3");
        });

        it('_receiversの１つでも0x000...だったらエラー', async () => {
            receivers = [noAddress, receiver2];
            amounts = [499, 501];
            await token.approve(batchTransferContract.address, allowanceAmount);
            await expectThrow(batchTransferContract.batchTransferToken(token.address, receivers, amounts));
        });

        it('コントラクトがmsg.senderによって承認されているトークンの量がきちんと表示されること allowanceForContract', async () => {
            await token.approve(batchTransferContract.address, allowanceAmount);
            let allowance = await batchTransferContract.allowanceForContract(token.address);
            assert.equal(Number(allowance), allowanceAmount, "allowanceForContract doesn't work correctly");
        });
    });

    describe('withdraw function', () => {
        it('_receiversの長さが0でエラー', async () => {
            sendingAmount = web3.toWei("0.5", "ether");
            receivers = [];
            amounts = [web3.toWei("0.2", "ether"), web3.toWei("0.3", "ether")];
            await expectThrow(batchTransferContract.batchTransferEther(receivers, amounts, {value:sendingAmount}));
        });

        it('_amountsの長さが0でエラー', async () => {
            sendingAmount = web3.toWei("0.5", "ether");
            receivers = [receiver1, receiver2];
            amounts = [];
            await expectThrow(batchTransferContract.batchTransferEther(receivers, amounts, {value:sendingAmount}));
        });

        it('_receiversの長さと_amountsの長さが異なる場合、エラー', async () => {
            sendingAmount = web3.toWei("0.5", "ether");
            receivers = [receiver1];
            amounts = [web3.toWei("0.2", "ether"), web3.toWei("0.3", "ether")];
            await expectThrow(batchTransferContract.batchTransferEther(receivers, amounts, {value:sendingAmount}));
        });

        it('msg.valueが0でエラー', async () => {
            sendingAmount = 0;
            receivers = [receiver1, receiver2];
            amounts = [web3.toWei("0.2", "ether"), web3.toWei("0.3", "ether")];
            await expectThrow(batchTransferContract.batchTransferEther(receivers, amounts, {value:sendingAmount}));
        });

        it('msg.valueと_amountsの総計が異なっていたらエラー', async () => {
            sendingAmount = web3.toWei("0.5", "ether");
            receivers = [receiver1, receiver2];
            amounts = [web3.toWei("0.19", "ether"), web3.toWei("0.3", "ether")];
            await expectThrow(batchTransferContract.batchTransferEther(receivers, amounts, {value:sendingAmount}));
        });

        it('_receiversの１つでも0x000...だったらエラー', async () => {
            sendingAmount = web3.toWei("0.5", "ether");
            receivers = [receiver1, noAddress];
            amounts = [web3.toWei("0.2", "ether"), web3.toWei("0.3", "ether")];
            await expectThrow(batchTransferContract.batchTransferEther(receivers, amounts, {value:sendingAmount}));
        });

        it('上手く送信できること', async () => {
            let beforeBalanceOfReveiver1 = web3.eth.getBalance(receiver1);
            let beforeBalanceOfReveiver2 = web3.eth.getBalance(receiver2);

            sendingAmount = web3.toWei("0.5", "ether");
            receivers = [receiver1, receiver2];
            amounts = [web3.toWei("0.2", "ether"), web3.toWei("0.3", "ether")];
            await batchTransferContract.batchTransferEther(receivers, amounts, {value:sendingAmount});

            let afterBalanceOfReveiver1 = web3.eth.getBalance(receiver1);
            let afterBalanceOfReveiver2 = web3.eth.getBalance(receiver2);

            assert.equal(Number(afterBalanceOfReveiver1) - Number(beforeBalanceOfReveiver1), web3.toWei("0.2", "ether"), "batchTransferEther doesn't work correctly1");
            assert.equal(Number(afterBalanceOfReveiver2) - Number(beforeBalanceOfReveiver2), web3.toWei("0.3", "ether"), "batchTransferEther doesn't work correctly2");
        });
    });

    describe('withdraw function', () => {
        it('送信先が0だったらエラー', async () => {
            let sendingAmount = 1000;
            await token.transfer(batchTransferContract.address, sendingAmount);
            await expectThrow(batchTransferContract.withdraw(noAddress, token.address));
        });

        it('トークンをコントラクトが持っていなかったらエラー', async () => {
            let sendingAmount = 0;
            await token.transfer(batchTransferContract.address, sendingAmount);
            await expectThrow(batchTransferContract.withdraw(receiver3, token.address));
        });

        it('オーナー以外が実行したら、エラー', async () => {
            let sendingAmount = 1000;
            await token.transfer(batchTransferContract.address, sendingAmount);
            await expectThrow(batchTransferContract.withdraw(receiver3, token.address, {from:receiver1}));
        });

        it('トークンをきちんと送信できること', async () => {
            let sendingAmount = 1000;
            let beforeTokenBalanceOfOwner = await token.balanceOf(owner);
            let beforeTokenBalanceOfContract = await token.balanceOf(batchTransferContract.address);
            let beforeTokenBalanceOfReceiver3 = await token.balanceOf(receiver3);

            await token.transfer(batchTransferContract.address, sendingAmount);
            await batchTransferContract.withdraw(receiver3, token.address);

            let afterTokenBalanceOfOwner = await token.balanceOf(owner);
            let afterTokenBalanceOfContract = await token.balanceOf(batchTransferContract.address);
            let afterTokenBalanceOfReceiver3 = await token.balanceOf(receiver3);

            assert.equal(Number(beforeTokenBalanceOfOwner) - Number(afterTokenBalanceOfOwner), 1000, "withdraw doesn't work correctly1");
            assert.equal(Number(afterTokenBalanceOfContract) - Number(beforeTokenBalanceOfContract), 0, "withdraw doesn't work correctly2");
            assert.equal(Number(afterTokenBalanceOfReceiver3) - Number(beforeTokenBalanceOfReceiver3), 1000, "withdraw doesn't work correctly3");
        });
    });
});