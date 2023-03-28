USE [Handel_Desarrollo]
GO

/****** Object:  Table [dbo].[public_users]    Script Date: 29/01/2020 01:10:22 p. m. ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[public_users](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[CardCode] [nvarchar](50) NULL,
	[business_id] [int] NULL,
 CONSTRAINT [PK_public_users] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO


