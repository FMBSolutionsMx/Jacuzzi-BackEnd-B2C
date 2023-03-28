USE [Handel_Desarrollo]
GO

/****** Object:  Table [dbo].[sap_config]    Script Date: 29/01/2020 01:10:59 p. m. ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[sap_config](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[sap_url_server] [varchar](300) NULL,
	[sap_version] [varchar](100) NULL,
	[sap_response] [varchar](100) NULL,
	[sap_body] [varchar](100) NULL,
	[business_id] [int] NULL,
 CONSTRAINT [PK_sap_config] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO


