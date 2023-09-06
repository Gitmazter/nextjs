import { useEffect } from "react"
import useBrideDirection from "./hooks/useBrideDirection"
import styles from '../../styles/mystyle.module.css'
export const DirSelector = () => {

  const { direction, setDirection } = useBrideDirection()

  const setSol2Eth = () => {
    setDirection('sol_to_eth')
  }

  const setEth2Sol = () => {
    setDirection('eth_to_sol')
  }

  useEffect(() => {console.log(direction);}, [direction])

  return (
    <div className={styles.requestDirection}>
      <div className={styles.innerRequestDirection}>
        <h2>Select Direction</h2>
        <div className={styles.DirSelectorIcons}>
          <img src="./solana.svg"/>
          <p>⇔</p>
          <img src="./ethereum.svg"/>
        </div>
        <button onClick={setSol2Eth}>{"SOLANA -> ETHEREUM"}</button>
        <button onClick={setEth2Sol}>{"ETHEREUM -> SOLANA"}</button>
      </div>
    </div>
  )
}