//idb manager files
 const databaseName = 'currency-converter-007damiendoumer-1';

 class IDBManager{

    constructor(){
        this._idbPromise = this.setupDatabase();
    }

    setupDatabase(){
        // If the browser doesn't support service worker,
        // we don't care about having a database
        if (!navigator.serviceWorker) {
            return Promise.resolve();
        }

        return idb.open(databaseName, 1, upgrade => {
            let store = upgrade.createObjectStore(databaseName, {
                keyPath: 'query'
            });
            return store;
        });
    }

    //Save a query in index db
    saveQueryInDatabase(query, value){

        this._idbPromise.then((db) => {

            if(!db) return;

            let transaction = db.transaction(databaseName, 'readwrite');
            let store = transaction.objectStore(databaseName);
            store.put({value:value, query:query});

        })
    }

    //get value from database
    getQueryValueByID(query, callBack){
        //Our ID id query in idb 
        this._idbPromise.then(db => {
            return db.transaction(databaseName).objectStore(databaseName)
                    .get(query);
        }).then(object => callBack(null, object))
        .catch(error => callBack(error, null));
        
    }
}
//end of idb manager files

const toSelect = document.getElementById("toCurrency");
const fromSelect = document.getElementById("fromCurrency");
const amountEntry = document.getElementById('amountToConvert');
const convertedValueEntry = document.getElementById('output');
//const url = https://free.currencyconverterapi.com/api/v5/currencies';
//fetch currencies

class Converter
{
    constructor(idbManager)
    {
        //the idb database to retrieve and save data to and from CACHE database
        this._idbManager = idbManager;
    }
//const url = 'https://free.currencyconverterapi.com/api/v5/currencies';
/*
fetch(url).then(  
    function(response) {  
      if (response.status !== 200) {  
        console.warn('Error in fetching currencies. Status Code: ' + 
          response.status);  
        return;  
      }
	*/
	
	 getAllCurrencies(callBack)
    {
        fetch("https://free.currencyconverterapi.com/api/v5/currencies")
        .then(response => callBack(null, response))
        .catch(error => callBack(error, null));
    }
	//converting currency from API method
convertCurrency(amount, fromCurrency, toCurrency, callBack)
    {
        fromCurrency = encodeURIComponent(fromCurrency);
        toCurrency = encodeURIComponent(toCurrency);
        const query = fromCurrency + '_' + toCurrency;
        lastQuery = query;

        //we build the URL
        const url = `https://free.currencyconverterapi.com/api/v5/convert?q=${query}&compact=ultra`;

        //Inquire IDB for the objects query
        this._idbManager.getQueryValueByID(query, (error, value) => {

            if(error){
                callBack(error);
                return;
            }

            //if the value was not found in idb, query the internet
            if(!value){

                fetch(url)
                .catch(error => callBack(error))
                .then(results => 
                {
                    //Invoke's the call back method of the upper layer using this class after 
                    //converting the result to json.
                    results.json().then(jsonData => 
                        {
                            //save the value and the query in idb first
                            this._idbManager.saveQueryInDatabase(query, jsonData[query]);

                            let total = jsonData[query] * amount;
                            callBack(null, (Math.round(total * 100) / 100));
                        });
                });                
            }
            //If the value was found in idb
            else{
                //get the value of the query
                let val = value['value'];
                let total = val * amount;
                callBack(null, (Math.round(total * 100) / 100));
            }
            //value.value

        })

    }
}
      // Examine the text in the response 
	  let idbMan = new IDBManager();
let converter = new Converter(idbMan);
	  converter.getAllCurrencies( (error, response) => 
        { 
      if(response)
            {
                
                response.json().then((jsonData) => {
                    let data = jsonData.results;
                    let set = {data};
                
                    Object.keys(jsonData.results).forEach((key,index) => {
                    
                       let currency = jsonData.results[key];
                      let option1 = document.createElement("option");
                        let option2 = document.createElement("option");

                        if(!currency.currencySymbol)
                        {    
                            option1.text = `(${currency.id}) ${currency.currencyName}`;
                            option2.text = `(${currency.id}) ${currency.currencyName}`;
                        }
                    
                        else
                        {
                            option1.text = `(${currency.id}) ${currency.currencyName} ${currency.currencySymbol}`;
                            option2.text = `(${currency.id}) ${currency.currencyName} ${currency.currencySymbol}`;
                        }

                       
                        option1.value = currency;
                        option2.value = currency;
                        toSelect.add(option1, null);
                        fromSelect.add(option2, null);
                    });
                });
            }
            else if(error)
            {
                alert("An error occurred while fetching the currencies.");
            }
        });
		
		
	//converting currency function
	function calculateCurrency()
	{
		const amount = amountEntry.value;
    if(amount)
    {        
        let fromCurrency = fromSelect.options[fromSelect.selectedIndex].innerHTML;
        let toCurrency = toSelect.options[toSelect.selectedIndex].innerHTML;

        let regExp = /\(([^)]+)\)/;
        let fromCurrencyKey = regExp.exec(fromCurrency)[1];
        let toCurrencyKey = regExp.exec(toCurrency)[1];

        if(fromCurrencyKey == toCurrencyKey)
        {
            convertedValueEntry.value = amount;
        }
        else
        {
            convertCurrency(amount, fromCurrencyKey, toCurrencyKey, (error, result) => 
            {
                convertedValueEntry.value = result;
				console.log(result);
                if(result)
                {
                    convertedValueEntry.value = result;
					 
                }
                else
                {
                    alert("An error occurred while making the request"+error);
                }
            });
        }
    }
    else
    {
        alert("please enter the amount which you wish to convert");
    }
	}
	

