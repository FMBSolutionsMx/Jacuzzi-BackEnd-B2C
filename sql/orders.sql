USE [Handel_React]
GO
/****** Object:  StoredProcedure [dbo].[Orders]    Script Date: 29/01/2020 01:09:27 p. m. ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

ALTER PROCEDURE [dbo].[Orders] @action NVARCHAR(50), @business NVARCHAR(50), @entry NVARCHAR(50) AS BEGIN
	SET NOCOUNT ON;
	DECLARE @query NVARCHAR(512)

	IF @action = 'getOrderDocumentNumber' BEGIN
		SET @query = 'SELECT DocNum FROM [192.168.0.181].[' + @business + '].[dbo].[ORDR] WHERE DocEntry = ' + @entry;
		EXECUTE sp_executesql @query
	END

	IF @action = 'getDeliveryDocumentNumber' BEGIN
		SET @query = 'SELECT DocNum FROM [192.168.0.181].[' + @business + '].[dbo].[ODLN] WHERE DocEntry = ' + @entry;
		EXECUTE sp_executesql @query
	END

	IF @action = 'getQuotationDocumentNumber' BEGIN
		SET @query = 'SELECT DocNum FROM [192.168.0.181].[' + @business + '].[dbo].[OQUT] WHERE DocEntry = ' + @entry;
		EXECUTE sp_executesql @query
	END

	IF @action = 'getInvoiceDocumentNumber' BEGIN
		SET @query = 'SELECT DocNum FROM [192.168.0.181].[' + @business + '].[dbo].[OINV] WHERE DocEntry = ' + @entry;
		EXECUTE sp_executesql @query
	END
END

