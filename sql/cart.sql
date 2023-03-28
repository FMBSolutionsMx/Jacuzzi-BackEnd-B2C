USE [Handel]
GO

SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

ALTER PROCEDURE [dbo].[ShoppingCart] @action nvarchar(50), @business nvarchar(50),  @cardCode nvarchar(100),  @id nvarchar(MAX),  @shoppingCart nvarchar(MAX) AS BEGIN
	SET NOCOUNT ON;
	DECLARE @query nvarchar(512)
	
	SET @query = 'SELECT T0.* FROM [dbo].[handel_profile] T0 ';

	IF @action = 'find' BEGIN
		SET @query = @query + 'WHERE T0.CardCode =' + char(39)  + @cardCode + char(39) ;
		EXECUTE sp_executesql @query
	END

	IF @action = 'create' BEGIN
		SET @query = 'INSERT INTO [dbo].[handel_profile] (CardCode, Favorites, ShoppingCart, BackOrder) VALUES (' + char(39)  + @cardCode + char(39) + ', ' + char(39)  + '[]' + char(39) + ', ' + char(39)  + '[]' + char(39) + ', ' + char(39)  + '[]' + char(39) + '); SELECT SCOPE_IDENTITY() AS id' ;
		EXECUTE sp_executesql @query
	END

	IF @action = 'update' BEGIN
		SET @query = 'UPDATE [dbo].[handel_profile] SET ShoppingCart = ' + char(39) + @shoppingCart  + char(39) + ' WHERE CardCode = ' + char(39) + @id + char(39);
		EXECUTE sp_executesql @query
	END

	IF @action = 'get-backorder' BEGIN
		SET @query = 'SELECT BackOrder FROM [dbo].[handel_profile] WHERE CardCode = ' + char(39) + @id + char(39);
		EXECUTE sp_executesql @query;
	END

	IF @action = 'update-backorder' BEGIN
		SET @query = 'UPDATE [dbo].[handel_profile] SET BackOrder = ' + char(39) + @shoppingCart  + char(39) + ' WHERE CardCode = ' + char(39) + @id + char(39);
		EXECUTE sp_executesql @query
	END
END