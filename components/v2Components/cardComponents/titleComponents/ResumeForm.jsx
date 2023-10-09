import styles from '../../../../styles/mystyle.module.css';

export const ResumeForm = ({ ResumeFormProps }) => {

  const {showResumeForm, setShowResumeForm} = ResumeFormProps

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(e.target.resumeInfo.value);
    
    setShowResumeForm(!showResumeForm);
  }

  return (
    <div className={styles.resumeForm}>
      <form onSubmit={handleSubmit}>
        <h2>Resume Bridge Flow</h2>

        <section className={styles.resumeDirection}>
          <h3>Direction</h3>  
          <span>
            <select>
              <option>Solana</option>
              <option>Ethereum</option>
            </select>
            <span>{" ---> "}</span>
            <select>
              <option>Ethereum</option>
              <option>Solana</option>
            </select>
          </span>
        </section>

        <div className={styles.resumeInfoType}>
          <span>
            <h3>Txid/Vaa<button type='button' className={styles.help}>?</button></h3>  
          </span>

          <input 
            type="radio" 
            id="txid" 
            name="idType" 
            value="txid" 
            required  
          />
          <label for="txid">Tx Hash</label>

          <input 
            type="radio" 
            id="vaa" 
            name="idType" 
            value="vaa" 
            required
          />
          <label for="vaa">VAA</label>
        </div>
        <textarea name="resumeInfo" id="resumeInfo" cols="30" rows="3" required minLength={64}></textarea>
        
        <button type='submit'>Submit</button>
      </form>
    </div>
  );
};