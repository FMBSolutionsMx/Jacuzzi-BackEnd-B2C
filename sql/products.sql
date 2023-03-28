USE [Handel_Desarrollo]
GO
/****** Object:  StoredProcedure [dbo].[Products]    Script Date: 29/01/2020 01:08:45 p. m. ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

ALTER PROCEDURE [dbo].[Products] @action nvarchar(50), @business nvarchar(50), @arg1 nvarchar(100), @arg2 nvarchar(100),  @arg3 nvarchar(100),  @arg4 nvarchar(100) AS BEGIN
	SET NOCOUNT ON;
	DECLARE @host nvarchar(64) = '[192.168.0.181].[' + @business + '].[dbo]';
	DECLARE @query nvarchar(1024);
	
	
	IF @action = 'categories' BEGIN
		SET @query = 'SELECT * FROM ' + @host + '.[@HANDEL_CATEGORIES]';
		EXECUTE sp_executesql @query;
		END
	ELSE IF @action = 'lastprices' BEGIN
		SET @query = 'SELECT TOP(3) T0.[DocDate], T0.[Quantity], T0.[Price] FROM ' + @host + '.[INV1] T0';
		SET @query = @query + ' INNER JOIN ' + @host + '.[OINV] T1 ON T0.[DocEntry] = T1.[DocEntry] WHERE T1.[CardCode] = ' + char(39) +  @arg1 + char(39) + ' AND  T0.[ItemCode] = ' + char(39)  + @arg2 + char(39);
		SET @query = @query + ' GROUP BY T0.[DocDate], T0.[Quantity], T0.[Price] ORDER BY T0.[DocDate] DESC';
		EXECUTE sp_executesql @query;
		END
	ELSE
		SET @query = 'SELECT T0.ItemCode, T0.FrgnName, T3.OnHand, T1.Price, T0.UserText, T0.U_Handel_Emocional, T0.U_Handel_Forma FROM ' + @host + '.[OITM] T0';
		SET @query = @query + ' INNER JOIN ' + @host + '.[ITM1] T1 ON T0.ItemCode = T1.ItemCode';
		SET @query = @query + ' INNER JOIN ' + @host + '.[OCRD] T2 ON T2.CardCode = ' + char(39) +  @arg1 + char(39);
		SET @query = @query + ' INNER JOIN ' + @host + '.[OITW] T3 ON T3.ItemCode = T0.ItemCode WHERE T1.PriceList = T2.ListNum AND T0.U_web = 1 AND T3.WhsCode = ' + char(39) + @arg2 + char(39);

		IF @action = 'details' BEGIN
			SET @query = @query + ' AND T0.ItemCode =' + char(39)  + @arg3 + char(39);
			EXECUTE sp_executesql @query;
			END
		ELSE IF @action = 'search' BEGIN
			IF @arg3 = 'general' BEGIN
				IF @arg4 = '' BEGIN
					EXECUTE sp_executesql @query;
					END
				ELSE BEGIN
					SET @query = @query + ' AND (T0.ItemCode LIKE ' + char(39) + '%' + @arg4 + '%' + char(39) + ' OR T0.FrgnName LIKE ' + char(39) + '%' + @arg4 + '%' + char(39) + ')';
					EXECUTE sp_executesql @query;
					END
				END
			ELSE BEGIN
				SET @query = @query + ' AND T0.U_handel_category = ' + char(39) + @arg4 + char(39);
				EXECUTE sp_executesql @query;
				END
			END
END
