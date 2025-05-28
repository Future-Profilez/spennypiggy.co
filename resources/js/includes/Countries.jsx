
export default function Countries({send}) {
  const data = [
    {
        "code": "AT",
        "label": "Austria",
        "phone": "43",
        "currency": "EUR"
    },
    {
        "code": "AU",
        "label": "Australia",
        "phone": "61",
        "currency": "AUD"
    },

    {
        "code": "AE",
        "label": "United Arab Emirates",
        "phone": "971",
        "currency": "AED"
    },
    {
        "code": "BE",
        "label": "Belgium",
        "phone": "32",
        "currency": "EUR"
    },
    
    {
        "code": "BG",
        "label": "Bulgaria",
        "phone": "359",
        "currency": "BGN"
    },
    
    {
        "code": "BR",
        "label": "Brazil",
        "phone": "55",
        "currency": "BRL"
    },

    {
        "code": "CA",
        "label": "Canada",
        "phone": "1",
        "currency": "CAD"
    },
    
    {
        "code": "CH",
        "label": "Switzerland",
        "phone": "41",
        "currency": "CHF"
    },
    
    {
        "code": "CY",
        "label": "Cyprus",
        "phone": "357",
        "currency": "EUR"
    },
    {
        "code": "CZ",
        "label": "Czech Republic",
        "phone": "420",
        "currency": "CZK"
    },
    {
        "code": "DE",
        "label": "Germany",
        "phone": "49",
        "currency": "EUR"
    },
    
    {
        "code": "DK",
        "label": "Denmark",
        "phone": "45",
        "currency": "DKK"
    },
    
    {
        "code": "EE",
        "label": "Estonia",
        "phone": "372",
        "currency": "EUR"
    },
    
    {
        "code": "ES",
        "label": "Spain",
        "phone": "34",
        "currency": "EUR"
    },
    
    {
        "code": "FI",
        "label": "Finland",
        "phone": "358",
        "currency": "EUR"
    },
    
    {
        "code": "FR",
        "label": "France",
        "phone": "33",
        "currency": "EUR"
    },
    {
        "code": "GH",
        "label": "Ghana",
        "phone": "233",
        "currency": "GHS"
    },
    {
        "code": "GI",
        "label": "Gibraltar",
        "phone": "350",
        "currency": "GIP"
    },
    
    {
        "code": "GR",
        "label": "Greece",
        "phone": "30",
        "currency": "EUR"
    },
    {
        "code": "HK",
        "label": "Hong Kong",
        "phone": "852",
        "currency": "HKD"
    },
    
    {
        "code": "HR",
        "label": "Croatia",
        "phone": "385",
        "currency": "EUR"
    },
    
    {
        "code": "HU",
        "label": "Hungary",
        "phone": "36",
        "currency": "HUF"
    },
    {
        "code": "ID",
        "label": "Indonesia",
        "phone": "62",
        "currency": "IDR"
    },
    {
        "code": "IE",
        "label": "Ireland",
        "phone": "353",
        "currency": "EUR"
    },
    {
        "code": "IN",
        "label": "India",
        "phone": "91",
        "currency": "INR"
    },
    {
        "code": "IT",
        "label": "Italy",
        "phone": "39",
        "currency": "EUR"
    },
    {
        "code": "JP",
        "label": "Japan",
        "phone": "81",
        "currency": "JPY"
    },
    {
        "code": "KE",
        "label": "Kenya",
        "phone": "254",
        "currency": "KES"
    },
    
    {
        "code": "LI",
        "label": "Liechtenstein",
        "phone": "423",
        "currency": "CHF"
    },
      
    {
        "code": "LT",
        "label": "Lithuania",
        "phone": "370",
        "currency": "EUR"
    },
    {
        "code": "LU",
        "label": "Luxembourg",
        "phone": "352",
        "currency": "EUR"
    },
    {
        "code": "LV",
        "label": "Latvia",
        "phone": "371",
        "currency": "EUR"
    },
      
    {
        "code": "MT",
        "label": "Malta",
        "phone": "356",
        "currency": "EUR"
    },
      
    {
        "code": "MX",
        "label": "Mexico",
        "phone": "52",
        "currency": "MXN"
    },
    {
        "code": "MY",
        "label": "Malaysia",
        "phone": "60",
        "currency": "MYR"
    },
      
    {
        "code": "NG",
        "label": "Nigeria",
        "phone": "234",
        "currency": "NGN"
    },
      
    {
        "code": "NL",
        "label": "Netherlands",
        "phone": "31",
        "currency": "EUR"
    },
    {
        "code": "NO",
        "label": "Norway",
        "phone": "47",
        "currency": "NOK"
    },
    {
        "code": "NZ",
        "label": "New Zealand",
        "phone": "64",
        "currency": "NZD"
    },
    {
        "code": "PL",
        "label": "Poland",
        "phone": "48",
        "currency": "PLN"
    },
    {
        "code": "PT",
        "label": "Portugal",
        "phone": "351",
        "currency": "EUR"
    },
    {
        "code": "RO",
        "label": "Romania",
        "phone": "40",
        "currency": "RON"
    },
    {
        "code": "SE",
        "label": "Sweden",
        "phone": "46",
        "currency": "SEK"
    },
    {
        "code": "SG",
        "label": "Singapore",
        "phone": "65",
        "currency": "SGD"
    },
    {
        "code": "SI",
        "label": "Slovenia",
        "phone": "386",
        "currency": "EUR"
    },
    {
        "code": "SK",
        "label": "Slovakia",
        "phone": "421",
        "currency": "EUR"
    },
    {
        "code": "TH",
        "label": "Thailand",
        "phone": "66",
        "currency": "THB"
    },
    {
        "code": "US",
        "label": "United States",
        "phone": "1",
        "currency": "USD"
    },
    {
        "code": "ZA",
        "label": "South Africa",
        "phone": "27",
        "currency": "ZAR"
    },
  ];

  const gifterdata = [
  {code:'AD',label:'Andorra',phone:'376'},
  {code:'AE',label:'United Arab Emirates',phone:'971'},
  {code:'AG',label:'Antigua and Barbuda',phone:'1268'},
  {code:'AI',label:'Anguilla',phone:'1264'},
  {code:'AL',label:'Albania',phone:'355'},
  {code:'AM',label:'Armenia',phone:'374'},
  {code:'AO',label:'Angola',phone:'244'},
  {code:'AQ',label:'Antarctica',phone:'672'},
  {code:'AS',label:'American Samoa',phone:'1684'},
  {code:'AT',label:'Austria',phone:'43'},
  {code:'AW',label:'Aruba',phone:'297'},
  {code:'AX',label:'Alland Islands',phone:'358'},
  {code:'AZ',label:'Azerbaijan',phone:'994'},
  {code:'BA',label:'Bosnia and Herzegovina',phone:'387'},
  {code:'BL',label:'Saint Barthelemy',phone:'590'},
  {code:'BM',label:'Bermuda',phone:'1441'},
  {code:'BN',label:'Brunei Darussalam',phone:'673'},
  {code:'BV',label:'Bouvet Island',phone:'47'},
  {code:'BY',label:'Belarus',phone:'375'},
  {code:'BZ',label:'Belize',phone:'501'},
  {code:'CC',label:'Cocos (Keeling) Islands',phone:'61'},
  {code:'CF',label:'Central African Republic',phone:'236'},
  {code:'CG',label:'Congo,Republic of the',phone:'242'},
  {code:'CH',label:'Switzerland',phone:'41'},
  {code:'CK',label:'Cook Islands',phone:'682'},
  {code:'CL',label:'Chile',phone:'56'},
  {code:'CR',label:'Costa Rica',phone:'506'},
  {code:'CU',label:'Cuba',phone:'53'},
  {code:'CV',label:'Cape Verde',phone:'238'},
  {code:'CW',label:'Curacao',phone:'599'},
  {code:'CX',label:'Christmas Island',phone:'61'},
  {code:'CY',label:'Cyprus',phone:'357'},
  {code:'CZ',label:'Czech Republic',phone:'420'},
  {code:'DE',label:'Germany',phone:'49',suggested:true},
  {code:'DJ',label:'Djibouti',phone:'253'},
  {code:'DK',label:'Denmark',phone:'45'},
  {code:'DM',label:'Dominica',phone:'1767'},
  {code:'DO',label:'Dominican Republic',phone:'1809'},
  {code:'EH',label:'Western Sahara',phone:'212'},
  {code:'ER',label:'Eritrea',phone:'291'},
  {code:'EE',label:'Estonia',phone:'372'},
  {code:'ES',label:'Spain',phone:'34'},
  {code:'FI',label:'Finland',phone:'358'},
  {code:'FJ',label:'Fiji',phone:'679'},
  {code:'FK',label:'Falkland Islands (Malvinas)',phone:'500'},
  {code:'FM',label:'Micronesia,Federated States of',phone:'691'},
  {code:'FO',label:'Faroe Islands',phone:'298'},
  {code:'FR',label:'France',phone:'33',suggested:true},
  {code:'GA',label:'Gabon',phone:'241'},
  {code:'GB',label:'United Kingdom',phone:'44',suggested:true},
  {code:'GD',label:'Grenada',phone:'1473'},
  {code:'GE',label:'Georgia',phone:'995'},
  {code:'GF',label:'French Guiana',phone:'594'},
  {code:'GG',label:'Guernsey',phone:'44'},
  {code:'GH',label:'Ghana',phone:'233'},
  {code:'GI',label:'Gibraltar',phone:'350'},
  {code:'GL',label:'Greenland',phone:'299'},
  {code:'GM',label:'Gambia',phone:'220'},
  {code:'GN',label:'Guinea',phone:'224'},
  {code:'GP',label:'Guadeloupe',phone:'590'},
  {code:'GQ',label:'Equatorial Guinea',phone:'240'},
  {code:'GR',label:'Greece',phone:'30'},
  {code:'GS',label:'South Georgia and the South Sandwich Islands',phone:'500'},
  {code:'GT',label:'Guatemala',phone:'502'},
  {code:'GU',label:'Guam',phone:'1671'},
  {code:'GW',label:'GuineaBissau',phone:'245'},
  {code:'GY',label:'Guyana',phone:'592'},
  {code:'HK',label:'Hong Kong',phone:'852'},
  {code:'HM',label:'Heard Island and McDonald Islands',phone:'672'},
  {code:'HN',label:'Honduras',phone:'504'},
  {code:'HR',label:'Croatia',phone:'385'},
  {code:'HU',label:'Hungary',phone:'36'},
  {code:'IE',label:'Ireland',phone:'353'},
  {code:'IL',label:'Israel',phone:'972'},
  {code:'IM',label:'Isle of Man',phone:'44'},
  {code:'IO',label:'British Indian Ocean Territory',phone:'246'},
  {code:'IS',label:'Iceland',phone:'354'},
  {code:'IT',label:'Italy',phone:'39'},
  {code:'JE',label:'Jersey',phone:'44'},
  {code:'JM',label:'Jamaica',phone:'1876'},
  {code:'JO',label:'Jordan',phone:'962'},
  {code:'KG',label:'Kyrgyzstan',phone:'996'},
  {code:'KI',label:'Kiribati',phone:'686'},
  {code:'KM',label:'Comoros',phone:'269'},
  {code:'KN',label:'Saint Kitts and Nevis',phone:'1869'},
  {code:'KR',label:'Korea,Republic of',phone:'82'},
  {code:'KW',label:'Kuwait',phone:'965'},
  {code:'KY',label:'Cayman Islands',phone:'1345'},
  {code:'KZ',label:'Kazakhstan',phone:'7'},
  {code:'LC',label:'Saint Lucia',phone:'1758'},
  {code:'LI',label:'Liechtenstein',phone:'423'},
  {code:'LR',label:'Liberia',phone:'231'},
  {code:'LS',label:'Lesotho',phone:'266'},
  {code:'LT',label:'Lithuania',phone:'370'},
  {code:'LU',label:'Luxembourg',phone:'352'},
  {code:'LV',label:'Latvia',phone:'371'},
  {code:'MD',label:'Moldova,Republic of',phone:'373'},
  {code:'ME',label:'Montenegro',phone:'382'},
  {code:'MF',label:'Saint Martin (French part)',phone:'590'},
  {code:'MG',label:'Madagascar',phone:'261'},
  {code:'MH',label:'Marshall Islands',phone:'692'},
  {code:'MK',label:'Macedonia,the Former Yugoslav Republic of',phone:'389'},
  {code:'MR',label:'Mauritania',phone:'222'},
  {code:'MS',label:'Montserrat',phone:'1664'},
  {code:'MT',label:'Malta',phone:'356'},
  {code:'MU',label:'Mauritius',phone:'230'},
  {code:'MV',label:'Maldives',phone:'960'},
  {code:'MW',label:'Malawi',phone:'265'},
  {code:'MY',label:'Malaysia',phone:'60'},
  {code:'MZ',label:'Mozambique',phone:'258'},
  {code:'NA',label:'Namibia',phone:'264'},
  {code:'NC',label:'New Caledonia',phone:'687'},
  {code:'NE',label:'Niger',phone:'227'},
  {code:'NF',label:'Norfolk Island',phone:'672'},
  {code:'NI',label:'Nicaragua',phone:'505'},
  {code:'NL',label:'Netherlands',phone:'31'},
  {code:'NO',label:'Norway',phone:'47'},
  {code:'NP',label:'Nepal',phone:'977'},
  {code:'NR',label:'Nauru',phone:'674'},
  {code:'NU',label:'Niue',phone:'683'},
  {code:'NZ',label:'New Zealand',phone:'64'},
  {code:'OM',label:'Oman',phone:'968'},
  {code:'PA',label:'Panama',phone:'507'},
  {code:'PE',label:'Peru',phone:'51'},
  {code:'PF',label:'French Polynesia',phone:'689'},
  {code:'PG',label:'Papua New Guinea',phone:'675'},
  {code:'PL',label:'Poland',phone:'48'},
  {code:'PM',label:'Saint Pierre and Miquelon',phone:'508'},
  {code:'PN',label:'Pitcairn',phone:'870'},
  {code:'PT',label:'Portugal',phone:'351'},
  {code:'PW',label:'Palau',phone:'680'},
  {code:'PY',label:'Paraguay',phone:'595'},
  {code:'QA',label:'Qatar',phone:'974'},
  {code:'RE',label:'Reunion',phone:'262'},
  {code:'RO',label:'Romania',phone:'40'},
  {code:'RS',label:'Serbia',phone:'381'},
  {code:'RW',label:'Rwanda',phone:'250'},
  {code:'SB',label:'Solomon Islands',phone:'677'},
  {code:'SC',label:'Seychelles',phone:'248'},
  {code:'SD',label:'Sudan',phone:'249'},
  {code:'SE',label:'Sweden',phone:'46'},
  {code:'SG',label:'Singapore',phone:'65'},
  {code:'SH',label:'Saint Helena',phone:'290'},
  {code:'SI',label:'Slovenia',phone:'386'},
  {code:'SJ',label:'Svalbard and Jan Mayen',phone:'47'},
  {code:'SK',label:'Slovakia',phone:'421'},
  {code:'SL',label:'Sierra Leone',phone:'232'},
  {code:'SM',label:'San Marino',phone:'378'},
  {code:'SR',label:'Suriname',phone:'597'},
  {code:'SS',label:'South Sudan',phone:'211'},
  {code:'SV',label:'El Salvador',phone:'503'},
  {code:'SX',label:'Sint Maarten (Dutch part)',phone:'599'},
  {code:'SZ',label:'Swaziland',phone:'268'},
  {code:'TC',label:'Turks and Caicos Islands',phone:'1649'},
  {code:'TD',label:'Chad',phone:'235'},
  {code:'TF',label:'French Southern Territories',phone:'262'},
  {code:'TJ',label:'Tajikistan',phone:'992'},
  {code:'TK',label:'Tokelau',phone:'690'},
  {code:'TL',label:'Timor-Leste',phone:'670'},
  {code:'TM',label:'Turkmenistan',phone:'993'},
  {code:'TN',label:'Tunisia',phone:'216'},
  {code:'TT',label:'Trinidad and Tobago',phone:'1868'},
  {code:'TV',label:'Tuvalu',phone:'688'},
  {code:'TZ',label:'Tanzania,United Republic of',phone:'255'},
  {code:'UG',label:'Uganda',phone:'256'},
  {code:'US',label:'United States',phone:'1',suggested:true},
  {code:'UY',label:'Uruguay',phone:'598'},
  {code:'UZ',label:'Uzbekistan',phone:'998'},
  {code:'VA',label:'Holy See (Vatican City State)',phone:'379'},
  {code:'VC',label:'Saint Vincent and the Grenadines',phone:'1784'},
  {code:'VE',label:'Venezuela',phone:'58'},
  {code:'VG',label:'British Virgin Islands',phone:'1284'},
  {code:'VI',label:'US Virgin Islands',phone:'1340'},
  {code:'VU',label:'Vanuatu',phone:'678'},
  {code:'WF',label:'Wallis and Futuna',phone:'681'},
  {code:'WS',label:'Samoa',phone:'685'},
  {code:'XK',label:'Kosovo',phone:'383'},
  {code:'YT',label:'Mayotte',phone:'262'},
  {code:'ZM',label:'Zambia',phone:'260'},
  {code:'ZW',label:'Zimbabwe',phone:'263'}
  ];

  const updated = data.sort((a, b) => a.label.localeCompare(b.label));
  return <>
    <div className="custom-country-select" >
      <select onChange={(e)=>send(e.target.value )} >
        <option value={null} disabled selected >Choose</option>
        {updated && updated.map((c, i)=>{ 
          return <>
            <option key={`country-${i}`} value={JSON.stringify(c)} >{c.label}</option>
          </> 
        })}
      </select>
    </div>
  </>;
}
