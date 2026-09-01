#property copyright "Eleventrades"
#property version   "1.00"
#property description "Exports closed MT5 deals locally for BETTERTRADES. No credentials or network access."
#property strict

input int SyncEverySeconds = 10;
input int HistoryDays = 3650;

string ExportFolder = "BETTERTRADES";
string ExportFile = "BETTERTRADES\\closed_trades.csv";

string CsvSafe(string value)
{
   StringReplace(value, "\"", "\"\"");
   return "\"" + value + "\"";
}

double EntryPriceForPosition(const long position_id, const long close_time)
{
   double value = 0.0, volume = 0.0;
   int total = HistoryDealsTotal();
   for(int i = 0; i < total; i++)
   {
      ulong ticket = HistoryDealGetTicket(i);
      if(ticket == 0 || HistoryDealGetInteger(ticket, DEAL_POSITION_ID) != position_id)
         continue;
      long entry = HistoryDealGetInteger(ticket, DEAL_ENTRY);
      long time = HistoryDealGetInteger(ticket, DEAL_TIME);
      if(time > close_time || (entry != DEAL_ENTRY_IN && entry != DEAL_ENTRY_INOUT))
         continue;
      double deal_volume = HistoryDealGetDouble(ticket, DEAL_VOLUME);
      value += HistoryDealGetDouble(ticket, DEAL_PRICE) * deal_volume;
      volume += deal_volume;
   }
   return volume > 0.0 ? value / volume : 0.0;
}

void ExportHistory()
{
   datetime end_time = TimeCurrent();
   datetime start_time = end_time - (datetime)(HistoryDays * 86400);
   if(!HistorySelect(start_time, end_time))
      return;

   FolderCreate(ExportFolder, FILE_COMMON);
   int file = FileOpen(ExportFile, FILE_WRITE|FILE_CSV|FILE_ANSI|FILE_COMMON, ',');
   if(file == INVALID_HANDLE)
   {
      Print("BETTERTRADES export error: ", GetLastError());
      return;
   }

   FileWrite(file, "#account", (string)AccountInfoInteger(ACCOUNT_LOGIN), AccountInfoString(ACCOUNT_SERVER),
             AccountInfoString(ACCOUNT_CURRENCY), DoubleToString(AccountInfoDouble(ACCOUNT_BALANCE), 2),
             DoubleToString(AccountInfoDouble(ACCOUNT_EQUITY), 2));
   FileWrite(file, "deal_id", "position_id", "close_time", "close_timestamp", "symbol", "direction",
             "entry_price", "exit_price", "volume", "profit", "commission", "swap", "fee", "comment");
   int total = HistoryDealsTotal();
   for(int i = 0; i < total; i++)
   {
      ulong ticket = HistoryDealGetTicket(i);
      if(ticket == 0) continue;
      long entry = HistoryDealGetInteger(ticket, DEAL_ENTRY);
      long type = HistoryDealGetInteger(ticket, DEAL_TYPE);
      if((entry != DEAL_ENTRY_OUT && entry != DEAL_ENTRY_OUT_BY && entry != DEAL_ENTRY_INOUT) ||
         (type != DEAL_TYPE_BUY && type != DEAL_TYPE_SELL))
         continue;

      long position_id = HistoryDealGetInteger(ticket, DEAL_POSITION_ID);
      long close_time = HistoryDealGetInteger(ticket, DEAL_TIME);
      string direction = type == DEAL_TYPE_SELL ? "Long" : "Short";
      FileWrite(file,
         (string)ticket,
         (string)position_id,
         TimeToString((datetime)close_time, TIME_DATE|TIME_SECONDS),
         (string)HistoryDealGetInteger(ticket, DEAL_TIME),
         HistoryDealGetString(ticket, DEAL_SYMBOL),
         direction,
         DoubleToString(EntryPriceForPosition(position_id, close_time), 8),
         DoubleToString(HistoryDealGetDouble(ticket, DEAL_PRICE), 8),
         DoubleToString(HistoryDealGetDouble(ticket, DEAL_VOLUME), 4),
         DoubleToString(HistoryDealGetDouble(ticket, DEAL_PROFIT), 2),
         DoubleToString(HistoryDealGetDouble(ticket, DEAL_COMMISSION), 2),
         DoubleToString(HistoryDealGetDouble(ticket, DEAL_SWAP), 2),
         DoubleToString(HistoryDealGetDouble(ticket, DEAL_FEE), 2),
         CsvSafe(HistoryDealGetString(ticket, DEAL_COMMENT))
      );
   }
   FileClose(file);
}

int OnInit()
{
   EventSetTimer(MathMax(2, SyncEverySeconds));
   ExportHistory();
   Print("BETTERTRADES local sync is active.");
   return INIT_SUCCEEDED;
}

void OnTimer() { ExportHistory(); }
void OnDeinit(const int reason) { EventKillTimer(); }
