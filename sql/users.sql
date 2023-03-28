USE [Handel_Desarrollo]
GO
/****** Object:  StoredProcedure [dbo].[Users]    Script Date: 29/01/2020 01:08:01 p. m. ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

ALTER PROCEDURE [dbo].[Users] @action nvarchar(50), @business nvarchar(50), @email nvarchar(100) AS BEGIN
	SET NOCOUNT ON;
	DECLARE @query nvarchar(512)

	IF @action = 'login' BEGIN
		SET @query = 'SELECT T0.CardCode, T0.CardName, T0.U_handel_email, T0.U_handel_password FROM [192.168.0.181].['+ @business +'].[dbo].[OCRD] T0 WHERE T0.U_handel_email = ' + char(39) +  @email + char(39);
		EXECUTE sp_executesql @query
	END
END