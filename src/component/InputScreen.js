import { useState } from "react";

// Code to generate the PFX file and download the file -- Start
import * as pkijs from 'pkijs';
import * as pvutils from 'pvutils';

function trimMessage(str){
    return (str.replaceAll(/.*----.*----/g,"").replace(/(\r\n|\n|\r)/gm, ""))
}

function destroyClickedElement(event) {
    document.body.removeChild(event.target);
}

function saveFile(result) {
    const pkcs12AsBlob = new Blob([result], { type: "application/x-pkcs12" });
    const downloadLink = document.createElement("a");
    downloadLink.download = "certificate.p12";
    downloadLink.innerHTML = "Download File";
    downloadLink.href = window.URL.createObjectURL(pkcs12AsBlob);
    downloadLink.onclick = destroyClickedElement;
    downloadLink.style.display = "none";
    document.body.appendChild(downloadLink);
    downloadLink.click();
}

async function generateCertificatePFX(key,cert,pwd){
    // console.log('-----inside generateCertificate------')
    // console.log('Key      : ',key);
    // console.log('Cert     : ',cert);
    // console.log('Password : ',pwd)
    // const certificateBASE64 = "MIICajCCAcwCFDynpN5Ssw9J1++fMnasb87rfJrgMAoGCCqGSM49BAMCMHQxCzAJBgNVBAYTAklOMRAwDgYDVQQIDAdHVUpBUkFUMQ8wDQYDVQQHDAZWQUxTQUQxCzAJBgNVBAoMAlBQMQswCQYDVQQLDAJQUDELMAkGA1UEAwwCUFAxGzAZBgkqhkiG9w0BCQEWDHBwQGdtYWlsLmNvbTAeFw0yMzA0MDQwOTU4MzZaFw0yMzA1MDQwOTU4MzZaMHQxCzAJBgNVBAYTAklOMRAwDgYDVQQIDAdHVUpBUkFUMQ8wDQYDVQQHDAZWQUxTQUQxCzAJBgNVBAoMAkFQMQswCQYDVQQLDAJBUDELMAkGA1UEAwwCQVAxGzAZBgkqhkiG9w0BCQEWDGFwQGdtYWlsLmNvbTCBmzAQBgcqhkjOPQIBBgUrgQQAIwOBhgAEAAuJXGrhINQZRFVKeCTw1Wu2ote3HYXfTpuscRSicZjFRJchjTVDecQEAdiURmwKO4oBtQTfnjLWn1iw8AjNu58/AePKbpoHPO/0BH/5IeZ+XhdQELS2QbyQb8C8ZIzOayAHZkyu3Osuyo63j2/JFHI7k22CKjUeTuo+lWdvag9cmX4PMAoGCCqGSM49BAMCA4GLADCBhwJBVCgEy9cJdHpmbgQSUdutgoARyWxDgOR9RXxeYcvoQbq8epUpwc6nnJfQpgGQuhhUNizEaTedMA1vGNs5QRu3fBwCQgGtXm7H/YEbv+SbmRZLS/EsNqKCJKqqmNIjKItrvsmoktHELDg+ciS67iGEdqKH1RW5a/m0Vr9L5u8Eq6U4WZEa0A=="
    // const privateKeyBASE64 = "MIHcAgEBBEIApLmnlJFKswUbZzxrVfT5YcUHt+uISytpBXn+L9KJCSQjv8AP/heJxoJoX6ghqpXmBcaj6MEU1yPBH7vZjAcPr+igBwYFK4EEACOhgYkDgYYABAALiVxq4SDUGURVSngk8NVrtqLXtx2F306brHEUonGYxUSXIY01Q3nEBAHYlEZsCjuKAbUE354y1p9YsPAIzbufPwHjym6aBzzv9AR/+SHmfl4XUBC0tkG8kG/AvGSMzmsgB2ZMrtzrLsqOt49vyRRyO5Ntgio1Hk7qPpVnb2oPXJl+Dw=="
    // const password = 'welogical'
    const certificateBASE64 = trimMessage(cert)
    // console.log(certificateBASE64);
    const privateKeyBASE64 = trimMessage(key)
    // console.log(privateKeyBASE64)
    const password = pwd
     //#region Create simplified structires for certificate and private key
     const certRaw = pvutils.stringToArrayBuffer(pvutils.fromBase64(certificateBASE64));
     const certSimpl = pkijs.Certificate.fromBER(certRaw);
     const pkcs8Raw = pvutils.stringToArrayBuffer(pvutils.fromBase64(privateKeyBASE64));
    //  const pkcs8Simpl = pkijs.PrivateKeyInfo.fromBER(pkcs8Raw);
     const pkcs8Simpl = pkijs.ECPrivateKey.fromBER(pkcs8Raw);
     console.log(pkcs8Simpl)
    //  const pvtJSON = pkcs8Simpl.toJSON()
     console.log('Private Key : ',pkcs8Simpl.privateKey);
     console.log('Public Key : ',pkcs8Simpl.publicKey);
     //#endregion
     //#region Put initial values for PKCS#12 structures
     const pkcs12 = new pkijs.PFX({
         parsedValue: {
             integrityMode: 0,
             authenticatedSafe: new pkijs.AuthenticatedSafe({
                 parsedValue: {
                     safeContents: [
                         {
                             privacyMode: 0,
                             value: new pkijs.SafeContents({
                                 safeBags: [
                                     new pkijs.SafeBag({
                                         bagId: "1.2.840.113549.1.12.10.1.1",
                                         bagValue: pkcs8Simpl
                                     }),
                                     new pkijs.SafeBag({
                                         bagId: "1.2.840.113549.1.12.10.1.3",
                                         bagValue: new pkijs.CertBag({
                                             parsedValue: certSimpl
                                         })
                                     })
                                 ]
                             })
                         }
                     ]
                 }
             })
         }
     });
     //#endregion
     //#region Encode internal values for all "SafeContents" firts (create all "Privacy Protection" envelopes)
     if (!(pkcs12.parsedValue && pkcs12.parsedValue.authenticatedSafe)) {
         throw new Error("pkcs12.parsedValue.authenticatedSafe is empty");
     }
    //  await pkcs12.parsedValue.authenticatedSafe.makeInternalValues({
    //      safeContents: [
    //          {
    //             //  encryptingCertificate: certSimpl,
    //              password: pvutils.stringToArrayBuffer(password),
    //              contentEncryptionAlgorithm: {
    //                  name: "AES-CBC",
    //                  length: 128
    //              },
    //             //  Added - Start
    //             hmacHashAlgorithm: "SHA-256",
    //             iterationCount: 2048
    //             // Added - End
    //          }
    //      ]
    //  });

     await pkcs12.parsedValue.authenticatedSafe.makeInternalValues({
         safeContents: [
             {
                // Empty parameters since we have "No Privacy" protection level for SafeContents
             }
         ]
     });
     //#endregion
     //#region Encode internal values for "Integrity Protection" envelope
     await pkcs12.makeInternalValues({
         password: pvutils.stringToArrayBuffer(password),
         iterations: 100000,
         pbkdf2HashAlgorithm: "SHA-256",
         hmacHashAlgorithm: "SHA-256"
     });

     //#endregion
     //#region Save encoded data
     //  console.log(pkcs12.toString())
     return pkcs12.toSchema().toBER(false);
     //#endregion
}
// Code to generate the PFX file and download the file -- End

function InputScreen(){
    const [key, setKey] = useState('');
    const [cert, setCert] = useState('');
    const [pwd, setPwd] = useState('');

    async function createPFXFile(){
        // console.log('---CreatePFXFile----')
        // console.log('Key - ',{key})
        // console.log('Certificate - ', {cert})
        // console.log('Password : ', {pwd})
        
        // Code to generate the PFX file and download the file -- Start
        saveFile(await generateCertificatePFX(key,cert,pwd))
        // Code to generate the PFX file and download the file -- End
    }

    return(
        <div>
            <div>
                <h1> Key </h1>
                <textarea id="1" name="key" rows="10" cols="100" value={key} onChange={e => setKey(e.target.value)}/>
                <h1> Certificate </h1>
                <textarea id="2" name="certificate" rows="10" cols="100" value={cert} onChange={e => setCert(e.target.value)} />
                <h1> password</h1>
                <input id="3" name="password" value={pwd} onChange={e => setPwd(e.target.value)} />
            </div>            
            <div>
            <button onClick={createPFXFile}>Generate PFX file</button>
            </div>
        </div>
    )
}

export default InputScreen;