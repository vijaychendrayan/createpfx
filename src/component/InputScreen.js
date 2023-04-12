import { useState } from "react";


function createPFXFile({key,cert}){
    console.log('Button Clicked')
    console.log('Key - ',{key})
    console.log('Certificate - ', {cert})
}


function InputScreen(){
    const [key, setKey] = useState('');
    const [cert, setCert] = useState('');

    function createPFXFile(){
        console.log('Button Clicked')
        console.log('Key - ',key)
        console.log('Certificate - ', cert)
    }

    

    return(
        <div>
            <div>
                <h1> Key </h1>
                <textarea id="1" name="key" rows="10" cols="100" value={key} onChange={e => setKey(e.target.value)}/>
                <h1> Certificate </h1>
                <textarea id="2" name="certificate" rows="10" cols="100" value={cert} onChange={e => setCert(e.target.value)} />
            </div>
            
            <div>
            <button onClick={createPFXFile}>Generate PFX file</button>
            </div>
        </div>
    )
}

export default InputScreen;