import styles from '../../../styles/mystyle.module.css'
import { useEffect, useState } from 'react';
import Card from '../Card';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import useConnectionInfo from '../hooks/useConnectionInfo';
import { IscIcon, OilIcon } from '../utils/IconImgs';
import useBalance from '../hooks/useBalance';
import SwapCard from '../SwapCard';
import SendCard from '../SendCard';
import { Connection } from '@solana/web3.js';
import { JsonRpcProvider, Provider } from '@ethersproject/providers';

export default function EthereumToSolanaApp({amount, curr_step, setBalance, setCurrStep, my_application}) {
  const solConnection = new Connection("http://localhost:8899", "confirmed");
  const ethConnection = new JsonRpcProvider('http://localhost:8545')
  const wallets = [useWallet(), useConnectionInfo()];
  const { connection } = useConnection();
  const { saveBalance } = useBalance();

  const [step0, setStep0] = useState(null);
  const [step1, setStep1] = useState(null);
  const [step2, setStep2] = useState(null);
  const [step3, setStep3] = useState(null);
  const [step4, setStep4] = useState(null);

  async function updateBalance() {
    if(wallets[0].publicKey && wallets[1]) {
      const solana_bal = await my_application.solana_swap.fetch_balance()
      const eth_bal = await my_application.ethereum_swap.fetch_balance()
      console.log(solana_bal)
      console.log(eth_bal)
      const result = []
      result.push({'item':'User ISC', 'solana':solana_bal.user_isc, 'ethereum':eth_bal.user_isc})
      result.push({'item':'User OIL', 'solana':solana_bal.user_oil, 'ethereum':eth_bal.user_oil})
      result.push({'item':'Pool ISC', 'solana':solana_bal.pool_isc, 'ethereum':eth_bal.pool_isc})
      result.push({'item':'Pool OIL', 'solana':solana_bal.pool_oil, 'ethereum':eth_bal.pool_oil})
      result.push({'item':'User SOL', 'solana':solana_bal.user_sol, 'ethereum':0})
      setBalance(result)
      saveBalance(result)
    }
  }

  useEffect(() => {
      const fetchData = async () => {
          await updateBalance();
      }
      fetchData()
  }, [])

  async function handleStep0() {
      if (curr_step != null) {
          return
      }
      try {
        setCurrStep('step_0_waiting');
        const txid = await my_application.ethereum_swap.swap_isc_to_oil(amount)
        setCurrStep("step_0_busy")
        await my_application.ethereum_swap.wait_until_finalized(txid)
        await updateBalance()
        setStep0(txid['hash'])
        console.log(txid)
        setCurrStep("step0")
      }
      catch(e) {
        // handle reject / fail
        console.log(e);
        setCurrStep(null)
      }
  }
  async function handleStep1() {
      if (curr_step != "step0") {
          return
      }
      try {
        setCurrStep('step_1_waiting');
        const txid = await my_application.wormhole.send_from_ethereum(amount);
        console.log(txid);
        setCurrStep("step_1_busy")
        //await my_application.ethereum_swap.wait_until_finalized(txid)
        setStep1(txid.transactionHash)
        //updateBalance()
        //setCurrStep("step1")
      }
      catch(e){
        console.log(e);
        setCurrStep("step0")
      }
  }

  useEffect(() => {
    if (step1 !== null && step2 == null) {
      const fetchVaa = async () => {
        let VAA = ''
        // Timeout to solve meta error "CONFIRM TIMEOUT TIME FOR MAINNET"
        try {
          setTimeout(async() => {
            setCurrStep("step_1_busy")
            const txid = await ethConnection.getTransactionReceipt(step1)
            console.log(txid);
            console.log(txid.transactionHash);
            VAA = await my_application.wormhole.get_vaa_bytes_ethereum(txid)
            console.log(VAA);
            setStep2(VAA)
            updateBalance();
            setCurrStep("step2");
        }, 5000);
        }
        catch(e) {
          console.log(e);
          setCurrStep('step0')
        }
      } 
      fetchVaa()
    }
  },[step1])
//   async function handleStep2() {
//       if (curr_step != "step1") {
//           return
//       }
//       setCurrStep("step_2_busy")
//       const vaa = await my_application.wormhole.get_vaa_bytes_ethereum(step1)
//       setStep2(vaa)
//       updateBalance()
//       setCurrStep("step2")
//   }
  async function handleStep3() {
      if (curr_step != "step2") {
          return
      }

      try {
        setCurrStep('step_3_waiting');
        const tx = await my_application.wormhole.complete_transfer_on_solana(step2.vaaBytes)
        setCurrStep("step_3_busy")
        await solConnection.confirmTransaction(tx)
        setStep3(tx)
        updateBalance()
        setCurrStep("step3")
      }
      catch(e) {
        console.log(e);
        setCurrStep('step2')
      }
  }

  useEffect(() => {
    console.log(step2);
    if (step2 != null) {
      const completeTransfer = async () => {
        try {
          setCurrStep('step_3_waiting');
          const tx = await my_application.wormhole.complete_transfer_on_solana(step2)
          setCurrStep("step_3_busy")
          await solConnection.confirmTransaction(tx)
          setStep3(tx)
          updateBalance()
          setCurrStep("step3")
        }
        catch(e) {
          console.log(e);
          setCurrStep('step2')
        }

      }
      completeTransfer()
    }
  }, [step2])

  async function handleStep4() {
      if (curr_step != "step3") {
          return
      }
      const options = {
        commitment: 'processed'
      };
      try {
        setCurrStep('step_4_waiting');
        const tx = await my_application.solana_swap.swap_oil_to_isc(amount)
        const txid = await wallets[0].sendTransaction(tx, connection, options);
        setCurrStep("step_4_busy")
        await solConnection.confirmTransaction(txid)
        setStep4(txid)
        updateBalance()
        setCurrStep(null)
      }
      catch(e){
        console.log(e);
        setCurrStep('step3')
      }
  }
  function AppSelector({amount, curr_step, setBalance, setCurrStep, my_application, direction}) {
      if (direction == 'sol_to_eth') {
          return <SolanaToEthereumApp
                  amount={amount}
                  curr_step={curr_step}
                  setBalance={setBalance}
                  setCurrStep={setCurrStep}
                  my_application={my_application}/>
      } else {
          return <EthereumToSolanaApp
                  amount={amount}
                  curr_step={curr_step}
                  setBalance={setBalance}
                  setCurrStep={setCurrStep}
                  my_application={my_application}/>
      }
  }
  const card_topics = [
      {
          'title': '1. Swap eISC for xOIL',
          'titlev2': {'from': {'name':'eIsc', 'icon': <IscIcon/> }, 'to':{'name':'xOil', 'icon': <OilIcon/> }},
          'content': 'Swap your Ethereum-Native ISC for xOIL',
          'skip': 'I already have xOil'
      },
      {
          'title': '2. Send xOIL to Wormhole and request VAA receipt',
          'content': 'Send the swapped OIL to Wormhole smart contract and request for a VAA',
          'skip' : 'I already have a Transaction Hash or VAA'
      },
      {
          'title': '3. Get VAA Bytes',
          'content': 'Check the Wormhole network for the verified message of solana transaction'
      },
      {
          'title': '3. Get OIL on Solana (3 signatures required) ',
          'content': 'Interact with the Wormhole smart contract on Ethereum to receive the xOIL in your wallet',
          'skip' : 'I already have OIL'
      },
      {
          'title': '4. Swap OIL For ISC',
          'titlev2': {'from': {'name':'Oil', 'icon': <OilIcon/> }, 'to':{'name':'ISC', 'icon': <IscIcon/> }},
          'content': 'Swap Your Oil for Solana native ISC'
      },
  ];

return <div className={styles.BridgeApp}>
          <SwapCard 
            step={0} 
            card_topic={card_topics[0]} 
            setCurrStep={setCurrStep} 
            data={step0} 
            loading={curr_step=="step_0_busy"} 
            enable={curr_step==null}    
            click_handler={handleStep0} 
            waiting={curr_step == 'step_0_waiting'}
          />
          <SendCard 
            step={1} 
            card_topic={card_topics[1]} 
            setCurrStep={setCurrStep}              
            loading={curr_step=="step_1_busy"} 
            enable={curr_step=="step0"} 
            click_handler={handleStep1} 
            waiting={curr_step == 'step_1_waiting'}  
            txid={step1} vaa={step2}  
            my_application={my_application}
            setStep1={setStep1}
            setStep2={setStep2}
            curr_step={curr_step}
          />
          <Card
            step={3} 
            card_topic={card_topics[3]} 
            setCurrStep={setCurrStep} 
            data={step3} 
            loading={curr_step=="step_3_busy"} 
            enable={curr_step=="step2"} 
            click_handler={handleStep3} 
            waiting={curr_step == 'step_3_waiting'} 
            setStep2={setStep2}
          />
          <SwapCard 
            step={4} 
            card_topic={card_topics[4]} 
            setCurrStep={setCurrStep} 
            data={step4} 
            loading={curr_step=="step_4_busy"} 
            enable={curr_step=="step3"} 
            click_handler={handleStep4} 
            waiting={curr_step == 'step_4_waiting'}
          />       
        </div>
}
