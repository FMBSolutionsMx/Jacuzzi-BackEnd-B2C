import moment from "moment";
import {publicDecrypt} from "crypto";

export class NewOrder {
    constructor() {
        let today = moment(new Date()).format('YYYY-MM-DD');
        this.DocDate = today;
        this.DocDueDate = today;
        this.TaxDate = today;
        this.ReqDate = today;
        this.TrsfrDate = today;
    }

    public OriginDocumentCreate = "";
    public DocType = "I";
    public DocumentType = "F";
    public WddStatus = "";
    public isDocumentWithAuthorization = false;
    public DocStatus = "";
    public DocEntry = "";
    public CardCode = "";
    public CardName = "";
    public Address = "";
    public ShipToCode = "";
    public Address2 = "";
    public NextFolio = "";
    public StatusDocument = "";
    public NumAtCard = "";
    public DocCur = "MXP";
    public SpecialProce = [];
    public Currencies = [];
    public DocCurDocumentsPayment = "";
    public ChangeRate = 1;
    public SerieName = "";
    public SerieCode = null;
    public SerieArray = [];
    public DocDate = '';
    public DocDueDate = '';
    public TaxDate = '';
    public ReqDate = '';
    public ReqType = '12';
    public Requester = '';
    public ReqName = '';
    public Branch = '';
    public BranchName = '';
    public Department = '';
    public DepartmentName = '';
    public Email = '';
    public Notify = 'N';
    public isSelectTo = false; // para validacion
    public isSelectOf = false; // para validfacion
    public SlpCode = "";
    public SlpName = "";
    public CntctCode = "";
    public CntctName = "";
    public OwnerCode = "";
    public OwnerName = "";
    public Comments = "";
    public Subtotal = 0;
    public DiscountPercent = 0;
    public Discount = 0;
    public TaxeDefaultPartner = '';
    public TaxeRateDefaultPartner = 0;
    public OcrCode2DefaultPartner = '';
    public AcctCodeDefaultPartner = '';
    public CogsAcctDefaultPartner = '';
    public AcctCodeNameDefaultPartner = '';
    public CogsAcctNameDefaultPartner = '';
    public Taxes = 0;
    public Total = 0;
    public Items = [];
    public ItemsPayments = [];
    public CheckList = [];
    public permissions = {};
    public servicesToUpdate = 1; // 1 = update all  2 = not update all

    public metodoPago = 0;
    public GroupNum = "";
    public GroupName = "";
    public PymCode = "";
    public PymName = "";

    public indexRowDetails = ""; // index to details when press any action
    public LastLineNumItems = -1;
    public SelectOf = '';

    // Traslados

    public Filler = "";
    public FillerName = "";
    public ToWhsCode = "";
    public ToWhsCodeName = "";
    public JrnlMemo = "";
    public GroupNumTraslado = "";
    public GroupNumTrasladoName = "";

    public PickRmrk = '';

    public wareHouseFinalOptional = false;
    public wareHouseFinalOptionalValue = "";

    //Pagos

    public TransId = "";
    public CounterRef = "";
    public NoDocSum = 0;
    public BpAct = "";
    public BpActName = "";
    public BpActFormatCode = "";

    public BpActCopy = "";
    public BpActNameCopy = "";
    public BpActFormatCodeCopy = "";

    public PayNoDoc = false;


    public CashSum = 0;
    public CreditSum = 0;
    public CheckSum = 0;
    public TrsfrSum = 0;
    public totalRecibido = 0;
    public totalDocumento = 0;
    public totalPago = 0;
    public totalRestante = 0;

    public TrsfrAcct = "";
    public TrsfrAcctName = "";
    public TrsfrAcctFormatCode = "";
    public TrsfrDate = '';
    public TrsfrRef = "";


    public CheckAcct = "";
    public CheckAcctName = "";
    public CheckAcctFormatCode = "";

    public CashAcct = "";
    public CashAcctName = "";
    public CashAcctFormatCode = "";


    // campo para poder diferenciar  en autorizar y crear auhorizado para traslados
    public ObjType = "";

    //UserFields

    public userFields = new UserFields;

};

export class UserFields {
    public userFields1 = "";
    public userFields2 = "";
    public userFields3 = "";
    public userFields4 = "";
    public userFields5 = "";
    public userFields6 = "";
    public userFields7 = "";
    public userFields8 = "";
    public userFields9 = "";
    public userFields10 = "";

    public userFields11 = "";
    public userFields12 = "";
    public userFields13 = "";
    public userFields14 = "";
    public userFields15 = "";
    public userFields16 = "";
    public userFields17 = "";
    public userFields18 = "";
    public userFields19 = "";
    public userFields20 = "";

    public userFields21 = "";
    public userFields22 = "";
    public userFields23 = "";
    public userFields24 = "";
    public userFields25 = "";
    public userFields26 = "";
    public userFields27 = "";
    public userFields28 = "";
    public userFields29 = "";
    public userFields30 = "";

    public userFields31 = "";
    public userFields32 = "";
    public userFields33 = "";
    public userFields34 = "";
    public userFields35 = "";
    public userFields36 = "";
    public userFields37 = "";
    public userFields38 = "";
    public userFields39 = "";
    public userFields40 = "";

    public userFields41 = "";
    public userFields42 = "";
    public userFields43 = "";
    public userFields44 = "";
    public userFields45 = "";
    public userFields46 = "";
    public userFields47 = "";
    public userFields48 = "";
    public userFields49 = "";
    public userFields50 = "";
}

export class NewItem {

    public LineStatus = false; // cLOSE false
    public LineNum = false;
    public BaseEntry = null;
    public BaseType = -1;
    public Baseline = null;
    public ItemCode = "";
    public ItemName = "";
    public InvntItem = '';
    public OriginalQuantity = 1;
    public OriginalQuantityClose = 1;
    public OpenQty = 1;
    public Quantity = 1;
    public HomePrice = 0;
    public Price = "";
    // public ChangeRate = 1;
    public Currency = '';
    public WhsCode = "";
    public WhsName = "";
    public OcrCode = "";
    public OcrName = "";
    public OcrCode2 = "";
    public OcrName2 = "";
    public OcrCode3 = "";
    public OcrName3 = "";
    public OcrCode4 = "";
    public OcrName4 = "";
    public OcrCode5 = "";
    public OcrName5 = "";
    public TaxeCode = "";
    public TaxeRate = 0;
    public AcctCode = '';
    public CogsAcct = '';
    public AcctCodeName = '';
    public CogsAcctName = '';
    public TaxeResult = 0;
    public DiscountPercent = 0;
    public Discount = 0;
    public Total = 0;
    public wareHouseStock = [];
    public stock = true;
    //traslados

    public Filler = "";
    public FillerName = "";
    public ToWhsCode = "";
    public ToWhsCodeName = "";
    public ItemNew = true;

}


export class NewItemPayment {
    public DocEntry = "";
    public DocNum = "";
    public DocCur = "";
    public docType = "";
    public RefDate = "";
    public daysLast = "";
    public total = "";
    public CheckAccount = "";
    public pastDueBalance = "";
    public totalPago = "";
    public differentCurrency = false;
}

export class NewItemCheck {
    constructor() {
        let today = moment(new Date()).format('YYYY-MM-DD');
        this.DueDate = today;
    }

    public DueDate = '';
    public CheckSum = 0;
    public CountryCod = "";
    public BankCode = "";
    public Branch = "";
    public AcctNum = "";
    public CheckNum = "";
    public Trnsfrable = "N";
}


export class BusinessPartner {

    public update = 0;
    public password = '';
    public CardCode = '';
    public ObjType = '';
    public CardType = '';
    public Balance = 0;
    public DNotesBal = 0;
    public OrdersBal = 0;
    public validFor = 'Y';
    public CardTypeName = '';
    public CardName = '';
    public GroupCode = '';
    public GroupCodeName = '';
    public Currency = '';
    public CurrencyName = '';
    public LicTradNum = '';
    public MainUsage = '';
    public Phone1 = '';
    public Phone2 = '';
    public E_mail = '';
    public SlpCode = '';
    public SlpName = '';
    public GroupNum = '';
    public GroupNumName = '';
    public PriceListNum = '';
    public PriceListNumName = '';
    public CreditLine = '';
    public DebtLine = '';
    public Territory = '';
    public TerritoryName = '';
    public CntctPrsn = '';
    public CntctPrsnName = '';
    public ShipToDef = '';
    public BillToDef = '';
    public deliveriesAddressEditIndex = null;
    public invoicesAddressEditIndex = null;
    public contactEditIndex = null;
    public DeliveriesAddress:any = [];
    public BillingAddress:any = [];
    public InvoicesAddress = [];
    public ContactPersons = [];
    public PayMethodCodes:any = [];
    public PymCode = '';
    public RefDetails = '';
    public PymCodeName = '';
    public userFields = new UserFields;
    public ChangeGroupNum = false;  //bandera para poder remplazar balores de la condicion de pago
}


export class ContactPersons {
    public Name = '';
    public Active = 'Y';
    public FirstName = '';
    public Title = '';
    public MiddleName = '';
    public Position = '';
    public LastName = '';
    public Tel1 = '';
    public Tel2 = '';
    public Cellolar = '';
    public Fax = '';
    public E_MailL = '';
    public Notes1 = '';
    public Notes2 = '';
}

export class Addresses {
    public Address = '';
    public Street = '';
    public Block = '';
    public City = '';
    public ZipCode = '';
    public County = '';
    public State = '';
    public Country = '';
    public TaxCode = '';
    public StreetNo = '';
    public Building = '';
    public GlblLocNum = '';
    public TaxOffice = '';
    public TypeOfAddress = '';
}

// Native SAP end


// userFields Dinamic

